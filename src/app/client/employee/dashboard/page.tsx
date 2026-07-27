import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getSubdomain } from "@/lib/subdomain";
import { EmployeeDashboardClient } from "./EmployeeDashboardClient";

export default async function EmployeeDashboardPage() {
  const subdomain = await getSubdomain();
  const cookieStore = await cookies();
  const employeeSessionId = cookieStore.get("employee_session")?.value;

  if (!subdomain || !employeeSessionId) {
    redirect("/client/employee/login");
  }

  const supabase = createSupabaseAdmin();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("subdomain", subdomain)
    .single();

  if (!client) {
    redirect("/client/employee/login");
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("id, first_name, last_name, status")
    .eq("id", employeeSessionId)
    .eq("client_id", client.id)
    .single();

  if (employee?.status !== "active") {
    redirect("/client/employee/login");
  }

  // Unfiltered: the client keeps every timesheet in memory so week
  // navigation (prev/next) is a local recompute, not a refetch.
  const { data: timesheets } = await supabase
    .from("timesheets")
    .select("*")
    .eq("employee_id", employee.id)
    .order("work_date", { ascending: false });

  return (
    <EmployeeDashboardClient
      employeeId={employee.id}
      employeeName={
        `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() ||
        "Employee"
      }
      initialTimesheets={timesheets ?? []}
    />
  );
}

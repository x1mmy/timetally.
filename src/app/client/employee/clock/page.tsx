import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getSubdomain } from "@/lib/subdomain";
import { ClockClient } from "./ClockClient";

export default async function ClockPage() {
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

  // Fetch the last 3 calendar days (server clock) so the row matching the
  // employee's *local* today is present no matter their timezone offset —
  // "today" itself is resolved client-side against the browser's clock.
  const { data: recentTimesheets } = await supabase
    .from("timesheets")
    .select("work_date, start_time, end_time")
    .eq("employee_id", employee.id)
    .order("work_date", { ascending: false })
    .limit(3);

  return (
    <ClockClient
      employeeId={employee.id}
      employeeName={`${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Employee"}
      recentTimesheets={recentTimesheets ?? []}
    />
  );
}

import { useState } from "react";
import { useLoaderData, Form, redirect, useActionData } from "react-router";
import SideBar from "../../components/sidebar";
import { getDB } from "~/db/getDB";
import type { ActionFunction } from "react-router";

interface Params {
  timesheetId: string;
}

interface Timesheet {
  id: number;
  employee_id: number;
  start_time: string;
  end_time: string;
  summary: string | null;
}

export const action: ActionFunction = async ({ request, params }: any) => {
  const db = await getDB();
  const { timesheetId } = params;
  const formData = await request.formData();

  const employee_id = parseInt(formData.get("employee_id") as string);
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const summary = formData.get("summary") as string;

  let errors: Record<string, string> = {};

  // ✅ Validate start and end time
  if (!start_time || !end_time) {
    errors.time = "Both start time and end time must be provided.";
  }

  // ✅ Validate employee_id
  const employee = await db.get("SELECT 1 FROM employees WHERE id = ?", [
    employee_id,
  ]);
  if (!employee) {
    errors.employee_id = "Employee does not exist.";
  }

  // ✅ Return errors if any
  if (Object.keys(errors).length > 0) {
    return new Response(JSON.stringify({ errors }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ✅ Update timesheet in the database
  await db.run(
    `UPDATE timesheets SET employee_id = ?, start_time = ?, end_time = ?, summary = ? WHERE id = ?`,
    [employee_id, start_time, end_time, summary || null, timesheetId]
  );

  return redirect("/timesheets");
};

export async function loader({ params }: { params: Params }) {
  try {
    const db = await getDB();
    const { timesheetId } = params;
    const timesheet = await db.get("SELECT * FROM timesheets WHERE id = ?", [
      timesheetId,
    ]);

    if (!timesheet) {
      throw new Response("Timesheet not found", { status: 404 });
    }
    const employees = await db.all(
      `SELECT id, full_name FROM employees ORDER BY full_name ASC`
    );

    return { timesheet, employees };
  } catch (error) {
    console.error("Database error:", error);
    throw new Response("Failed to load timesheet data", { status: 500 });
  }
}

export default function TimesheetPage() {
  const { timesheet, employees } = useLoaderData();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const actionData = useActionData() as { errors?: Record<string, string> };
  const errors = actionData?.errors || {};
  const [data, setData] = useState<Timesheet>({
    id: timesheet.id,
    employee_id: timesheet.employee_id,
    start_time: timesheet.start_time,
    end_time: timesheet.end_time,
    summary: timesheet.summary || "",
  });

  if (!timesheet) {
    return <div>Timesheet not found</div>;
  }

  return (
    <div className="flex gap-3">
      <SideBar />
      {loading ? (
        <div className="flex-1 pl-[260px]">Loading Data</div>
      ) : (
        <div className="flex-1 pl-[260px]">
          <div className="flex items-center justify-between w-full">
            <h1>Timesheet #{timesheet.id}</h1>
            <button
              className={`p-2 rounded text-white cursor-pointer ${
                isEditing ? "cancel-button" : "update-button"
              }`}
              onClick={(e) => setIsEditing((prev) => !prev)}
              aria-label={isEditing ? "Cancel editing" : "Update timesheet"}
              aria-disabled={loading}
              disabled={loading}
            >
              {isEditing ? "Cancel" : "Update"}
            </button>
          </div>
          <Form
            method="put"
            className="grid grid-cols-2 gap-3 w-full md:w-[60%]"
          >
            <label className="flex flex-col gap-2 w-full">
              Employee
              <select
                name="employee_id"
                defaultValue={
                  timesheet.employee_id
                    ? timesheet.employee_id
                    : data.employee_id
                }
                className="outline-none border border-gray-300 p-2 rounded"
                disabled={!isEditing}
              >
                <option value="">Select Employee</option>
                {employees.map((employee: any) => (
                  <option value={employee.id}>{employee.full_name}</option>
                ))}
              </select>
              {errors.employee_id && (
                <p className="text-red-500 text-sm">{errors.employee_id}</p>
              )}
            </label>

            <label className="flex flex-col gap-2 w-full">
              Start Time
              <input
                type="datetime-local"
                name="start_time"
                value={isEditing ? data.start_time : timesheet.start_time}
                className="outline-none border border-gray-300 p-2 rounded"
                disabled={!isEditing}
              />
              {errors.time && (
                <p className="text-red-500 text-sm">{errors.time}</p>
              )}
            </label>

            <label className="flex flex-col gap-2 w-full">
              End Time
              <input
                type="datetime-local"
                name="end_time"
                value={isEditing ? data.end_time : timesheet.end_time}
                className="outline-none border border-gray-300 p-2 rounded"
                disabled={!isEditing}
              />
            </label>

            <label className="flex flex-col gap-2 w-full">
              Summary
              <textarea
                name="summary"
                value={data.summary ? data.summary : timesheet.summary || ""}
                className="outline-none border border-gray-300 p-2 rounded resize-none"
                disabled={!isEditing}
              />
            </label>

            {isEditing && (
              <button
                className="p-2 col-span-2 rounded bg-[#0e83cc] text-white transition-all duration-[0.3s] hover:bg-[#025194] cursor-pointer"
                type="submit"
                disabled={!isEditing || loading}
              >
                Update
              </button>
            )}
          </Form>
        </div>
      )}
    </div>
  );
}

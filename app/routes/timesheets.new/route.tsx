import { useState } from "react";
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  type ActionFunction,
} from "react-router";
import SideBar from "~/components/sidebar";
import { getDB } from "~/db/getDB";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const db = await getDB();

  const employee_id = formData.get("employee_id") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const summary = formData.get("summary") as string;

  let errors: Record<string, string> = {};

  // ✅ Validate employee_id
  const employee = await db.get("SELECT 1 FROM employees WHERE id = ?", [
    employee_id,
  ]);

  if (!employee) {
    errors.employee_id = "Employee does not exist.";
  }

  // ✅ Validate start_time and end_time
  if (!start_time || !end_time) {
    errors.time = "Both start and end time are required.";
  }

  if (new Date(start_time) >= new Date(end_time)) {
    errors.time = "End time must be after start time.";
  }

  // If there are validation errors, return them
  if (Object.keys(errors).length > 0) {
    return new Response(JSON.stringify({ errors }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await db.run(
    `INSERT INTO timesheets (employee_id, start_time, end_time, summary) 
    VALUES (?, ?, ?, ?)`,
    [employee_id, start_time, end_time, summary]
  );

  return redirect("/timesheets");
};

export async function loader() {
  const db = await getDB();
  const result = await db.all(
    `SELECT id, full_name FROM employees ORDER BY full_name ASC`
  );

  return {
    employees: result,
  };
}

export default function CreateTimesheetPage() {
  const { employees } = useLoaderData();
  const errors = useActionData() as { errors?: Record<string, string> };
  const [data, setData] = useState({
    employee_id: "",
    start_time: "",
    end_time: "",
    summary: "",
  });

  return (
    <div>
      <SideBar />
      <div className="flex flex-col gap-3 pl-[260px]">
        <h1>Create New Timesheet</h1>
        <Form
          method="post"
          className="grid grid-cols-2 gap-3 w-full md:w-[60%]"
        >
          <label className="flex flex-col gap-2 w-full">
            Employee
            <select
              name="employee_id"
              className="outline-none border border-gray-300 p-2 rounded"
              value={data.employee_id}
              onChange={(e) =>
                setData({ ...data, employee_id: e.target.value })
              }
            >
              <option value="">Select Employee</option>
              {employees.map((employee: any) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
            {errors?.errors?.employee_id && (
              <p className="text-red-500 text-sm">
                {errors.errors.employee_id}
              </p>
            )}
          </label>

          <label className="flex flex-col gap-2 w-full">
            Start Time
            <input
              type="datetime-local"
              name="start_time"
              className="outline-none border border-gray-300 p-2 rounded"
              value={data.start_time}
              onChange={(e) => setData({ ...data, start_time: e.target.value })}
            />
          </label>

          <label className="flex flex-col gap-2 w-full">
            End Time
            <input
              type="datetime-local"
              name="end_time"
              className="outline-none border border-gray-300 p-2 rounded"
              value={data.end_time}
              onChange={(e) => setData({ ...data, end_time: e.target.value })}
            />
            {errors?.errors?.time && (
              <p className="text-red-500 text-sm">{errors.errors.time}</p>
            )}
          </label>

          <label className="flex flex-col gap-2 w-full">
            Summary (Optional)
            <textarea
              name="summary"
              className="outline-none border border-gray-300 p-2 rounded"
              value={data.summary}
              onChange={(e) => setData({ ...data, summary: e.target.value })}
            />
          </label>

          <button
            className="p-2 col-span-2 rounded bg-[#0e83cc] text-white transition-all duration-[0.3s] hover:bg-[#025194] cursor-pointer"
            type="submit"
          >
            Create
          </button>
        </Form>
      </div>
    </div>
  );
}

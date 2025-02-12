import { useRef, useState } from "react";
import { useLoaderData, Form, redirect, useActionData } from "react-router";
import SideBar from "../../components/sidebar";
import { getDB } from "~/db/getDB";
import type { ActionFunction } from "react-router";
import fs from "fs";
import path from "path";
import placeholder from "~/welcome/palceholder.png";

interface Params {
  employeeId: string;
}

interface Employee {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  job_title: string;
  department: string;
  salary: number;
  start_date: string;
  end_date: string | null | any;
  photo_path: string;
}

export const action: ActionFunction = async ({ request, params }: any) => {
  const db = await getDB();
  const { employeeId } = params;
  const formData = await request.formData();

  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const phone_number = formData.get("phone_number") as string;
  const date_of_birth = formData.get("date_of_birth") as string;
  const job_title = formData.get("job_title") as string;
  const department = formData.get("department") as string;
  const salary = parseFloat(formData.get("salary") as string);
  const start_date = formData.get("start_date") as string;
  const end_date = formData.get("end_date") as string | null;
  const photo = formData.get("photo") as File | null;

  let errors: Record<string, string> = {};

  // ✅ Validate salary
  if (isNaN(salary) || salary < 25000) {
    errors.salary = "Salary must be at least 25,000.";
  }

  let photo_path = "";

  console.log({ outside: photo });

  if (photo && photo.name) {
    console.log({ here: photo });
    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "employees"
    );

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(photo.name);
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    const buffer = Buffer.from(await photo.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    photo_path = `/uploads/employees/${fileName}`;
  }

  // ✅ Return errors if any
  if (Object.keys(errors).length > 0) {
    return new Response(JSON.stringify({ errors }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ✅ Update employee in the database
  await db.run(
    "UPDATE employees SET full_name = ?, email = ?, phone_number = ?, date_of_birth = ?, job_title = ?, department = ?, salary = ?, start_date = ?, end_date = ?, photo_path = ? WHERE id = ?",
    [
      full_name,
      email,
      phone_number,
      date_of_birth,
      job_title,
      department,
      salary,
      start_date,
      end_date || null,
      photo_path, // Ensures the existing image is retained if no new file is provided
      employeeId,
    ]
  );

  return redirect("/employees");
};

export async function loader({ params }: { params: Params }) {
  try {
    const db = await getDB();
    const { employeeId } = params;
    const employee = await db.get("SELECT * FROM employees WHERE id = ?", [
      employeeId,
    ]);

    if (!employee) {
      throw new Response("Employee not found", { status: 404 });
    }

    return { employee };
  } catch (error) {
    console.error("Database error:", error);
    throw new Response("Failed to load employee data", { status: 500 });
  }
}

export default function EmployeePage() {
  const { employee } = useLoaderData() as { employee: Employee };
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const actionData = useActionData() as { errors?: Record<string, string> };
  const errors = actionData?.errors || {};
  const [data, setData] = useState<Employee>({
    id: employee.id,
    full_name: employee.full_name,
    email: employee.email,
    phone_number: employee.phone_number,
    date_of_birth: employee.date_of_birth,
    job_title: employee.job_title,
    department: employee.department,
    salary: employee.salary,
    start_date: employee.start_date,
    end_date: employee.end_date,
    photo_path: employee.photo_path,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setData({ ...data, photo_path: URL.createObjectURL(file) });
      const formData = new FormData();
      formData.append("photo", file);
    }
  };

  if (!employee) {
    return <div>Employee not found</div>;
  }

  return (
    <div className="flex gap-3">
      <SideBar />
      {loading ? (
        <div className="flex-1 pl-[260px]">Loading Data</div>
      ) : (
        <div className="flex-1 pl-[260px]">
          <div className="flex items-center justify-between w-full">
            <h1>Employee #{employee.id}</h1>
            <button
              className={`p-2 rounded text-white cursor-pointer ${
                isEditing ? "cancel-button" : "update-button"
              }`}
              onClick={(e) => setIsEditing((prev) => !prev)}
              aria-label={isEditing ? "Cancel editing" : "Update employee"}
              aria-disabled={loading}
              disabled={loading}
            >
              {isEditing ? "Cancel" : "Update"}
            </button>
          </div>
          <Form
            method="put"
            encType="multipart/form-data"
            className="grid grid-cols-2 columns-2 gap-3 w-full md:w-[60%]"
          >
            <div className="col-span-2 flex items-center justify-center">
              <img
                src={data.photo_path.length > 0 ? data.photo_path : placeholder} // Show uploaded image preview
                alt="Profile"
                className="cursor-pointer object-contain w-[150px] h-[150px] rounded-full"
                onClick={() => inputRef.current?.click()}
              />
              <input
                accept=".png, .jpg, .jpeg, .gif"
                type="file"
                disabled={!isEditing}
                hidden
                ref={inputRef}
                name="photo"
                onChange={handleFileChange}
              />
            </div>
            <label className="flex flex-col gap-2 w-full">
              Full Name
              <input
                type="text"
                name="full_name"
                value={isEditing ? data.full_name : employee.full_name}
                className="outline-none border border-gray-300 p-2 rounded"
                disabled={!isEditing}
              />
            </label>
            <label className="flex flex-col gap-2 w-full">
              Email Address
              <input
                type="email"
                name="email"
                value={isEditing ? data.email : employee.email}
                className="outline-none border border-gray-300 p-2 rounded"
                disabled={!isEditing}
              />
            </label>
            <label className="flex flex-col gap-2 w-full">
              Phone Number
              <input
                type="text"
                name="phone_number"
                value={isEditing ? data.phone_number : employee.phone_number}
                className="outline-none border border-gray-300 p-2 rounded"
                disabled={!isEditing}
              />
            </label>
            <label className="flex flex-col gap-2 w-full">
              Date of Birth
              <input
                type="date"
                name="date_of_birth"
                value={isEditing ? data.date_of_birth : employee.date_of_birth}
                className="outline-none border border-gray-300 p-2 rounded"
                disabled={!isEditing}
              />
              {errors.date_of_birth && (
                <p className="text-red-500 text-sm">{errors.date_of_birth}</p>
              )}
            </label>
            <label className="flex flex-col gap-2 w-full">
              Job Title
              <input
                type="text"
                name="job_title"
                value={isEditing ? data.job_title : employee.job_title}
                className="outline-none border border-gray-300 p-2 rounded"
                disabled={!isEditing}
              />
            </label>
            <label className="flex flex-col gap-2 w-full">
              Department
              <input
                type="text"
                name="department"
                value={isEditing ? data.department : employee.department}
                className="outline-none border border-gray-300 p-2 rounded"
                disabled={!isEditing}
              />
            </label>
            <label className="flex flex-col gap-2 w-full">
              Salary
              <input
                type="number"
                name="salary"
                value={isEditing ? data.salary : employee.salary}
                className="outline-none border border-gray-300 p-2 rounded"
                disabled={!isEditing}
              />
              {errors.salary && (
                <p className="text-red-500 text-sm">{errors.salary}</p>
              )}
            </label>
            <label className="flex flex-col gap-2 w-full">
              Start Date
              <input
                type="date"
                name="start_date"
                value={isEditing ? data.start_date : employee.start_date}
                className="outline-none border border-gray-300 p-2 rounded"
                disabled={!isEditing}
              />
            </label>
            <label className="flex col-span-2 flex-col gap-2 w-full">
              End Date
              <input
                type="date"
                name="end_date"
                value={isEditing ? data.end_date : employee.end_date || ""}
                className="outline-none border border-gray-300 p-2 rounded"
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

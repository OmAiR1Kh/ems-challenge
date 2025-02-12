import fs from "fs";
import path from "path";
import { useRef, useState } from "react";
import {
  Form,
  redirect,
  useActionData,
  type ActionFunction,
} from "react-router";
import SideBar from "~/components/sidebar";
import { getDB } from "~/db/getDB";
import placeholder from "~/welcome/palceholder.png";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const db = await getDB();

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

  // ✅ Validate age (should be 18 or above)
  const today = new Date();
  const birthDate = new Date(date_of_birth);
  const age = today.getFullYear() - birthDate.getFullYear();

  if (
    age < 18 ||
    (age === 18 && today < new Date(birthDate.setFullYear(today.getFullYear())))
  ) {
    errors.date_of_birth = "Employee must be at least 18 years old.";
  }

  // ✅ Validate salary (should be at least 25000)
  if (isNaN(salary) || salary < 25000) {
    errors.salary = "Salary must be at least 25,000.";
  }

  // ✅ Check if email is already used
  const existingEmployee = await db.get(
    "SELECT 1 FROM employees WHERE email = ?",
    [email]
  );

  if (existingEmployee) {
    errors.email = "This email is already in use.";
  }

  // If there are validation errors, return them
  if (Object.keys(errors).length > 0) {
    return new Response(JSON.stringify({ errors }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let photo_path = "";

  if (photo && photo.name) {
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

  await db.run(
    `INSERT INTO employees 
      (full_name, email, phone_number, date_of_birth, job_title, department, salary, start_date, end_date, photo_path) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      photo_path,
    ]
  );

  return redirect("/employees");
};

export default function NewEmployeePage() {
  const errors = useActionData() as { errors?: Record<string, string> };
  const [data, setData] = useState({
    id: "",
    full_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    job_title: "",
    department: "",
    salary: "",
    start_date: "",
    end_date: "",
    photo_path: "",
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setData({ ...data, photo_path: URL.createObjectURL(file) });
    }
  };
  return (
    <div>
      <SideBar />
      <div className="flex flex-col gap-3 pl-[260px]">
        <h1>Create New Employee</h1>
        <Form
          method="post"
          encType="multipart/form-data"
          className="grid grid-cols-2 columns-2 gap-3 w-full md:w-[60%]"
        >
          <div className="col-span-2 flex items-center justify-center">
            <img
              src={data.photo_path || placeholder} // Show uploaded image preview
              alt="Profile"
              className="cursor-pointer object-contain w-[150px] h-[150px] rounded-full"
              onClick={() => inputRef.current?.click()}
            />
            <input
              accept=".png, .jpg, .jpeg, .gif"
              type="file"
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
              className="outline-none border border-gray-300 p-2 rounded"
            />
          </label>
          <label className="flex flex-col gap-2 w-full">
            Email Address
            <input
              type="email"
              name="email"
              className="outline-none border border-gray-300 p-2 rounded"
            />
            {errors?.errors?.email && (
              <p className="text-red-500 text-sm">{errors.errors.email}</p>
            )}
          </label>
          <label className="flex flex-col gap-2 w-full">
            Phone Number
            <input
              type="text"
              name="phone_number"
              className="outline-none border border-gray-300 p-2 rounded"
            />
          </label>
          <label className="flex flex-col gap-2 w-full">
            Date of Birth
            <input
              type="date"
              name="date_of_birth"
              className="outline-none border border-gray-300 p-2 rounded"
            />
            {errors?.errors?.date_of_birth && (
              <p className="text-red-500 text-sm">
                {errors.errors.date_of_birth}
              </p>
            )}
          </label>
          <label className="flex flex-col gap-2 w-full">
            Job Title
            <input
              type="text"
              name="job_title"
              className="outline-none border border-gray-300 p-2 rounded"
            />
          </label>
          <label className="flex flex-col gap-2 w-full">
            Department
            <input
              type="text"
              name="department"
              className="outline-none border border-gray-300 p-2 rounded"
            />
          </label>
          <label className="flex flex-col gap-2 w-full">
            Salary
            <input
              type="number"
              name="salary"
              className="outline-none border border-gray-300 p-2 rounded"
            />
            {errors?.errors?.salary && (
              <p className="text-red-500 text-sm">{errors.errors.salary}</p>
            )}
          </label>
          <label className="flex flex-col gap-2 w-full">
            Start Date
            <input
              type="date"
              name="start_date"
              className="outline-none border border-gray-300 p-2 rounded"
            />
          </label>
          <label className="flex col-span-2 flex-col gap-2 w-full">
            End Date
            <input
              type="date"
              name="end_date"
              className="outline-none border border-gray-300 p-2 rounded"
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

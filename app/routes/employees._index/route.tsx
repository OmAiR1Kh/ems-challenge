import { FaRegEye } from "react-icons/fa";
import { Link, useLoaderData, useSearchParams } from "react-router";
import SideBar from "~/components/sidebar";
import { getDB } from "~/db/getDB";
import placeholder from "~/welcome/palceholder.png";

export async function loader({ request }: { request: Request }) {
  const db = await getDB();
  const url = new URL(request.url);

  // Pagination
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = 4; // Employees per page
  const offset = (page - 1) * pageSize;

  // Filtering
  const search = url.searchParams.get("search")?.trim().toLowerCase() || "";

  // Get all column names dynamically
  const columnsData = await db.all("PRAGMA table_info(employees)");
  const columnNames = columnsData
    .map((col: any) => col.name)
    .filter((name: string) => name !== "id"); // Exclude `id`

  let query = "SELECT * FROM employees";
  let params: any[] = [];

  if (search) {
    const searchConditions = columnNames
      .map((col) => `LOWER(${col}) LIKE ?`)
      .join(" OR ");
    query += ` WHERE ${searchConditions}`;
    params = Array(columnNames.length).fill(`%${search}%`);
  }

  query += " LIMIT ? OFFSET ?";
  params.push(pageSize, offset);

  // Get filtered + paginated employees
  const employees = await db.all(query, params);

  // Get total count for pagination
  const totalEmployees = await db.get(
    `SELECT COUNT(*) as count FROM employees ${
      search
        ? `WHERE ${columnNames
            .map((col) => `LOWER(${col}) LIKE ?`)
            .join(" OR ")}`
        : ""
    }`,
    search ? Array(columnNames.length).fill(`%${search}%`) : []
  );

  return {
    employees,
    currentPage: page,
    totalPages: Math.ceil(totalEmployees.count / pageSize),
    search,
  };
}

export default function EmployeesPage() {
  const { employees, currentPage, totalPages, search } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSearchParams({ search: formData.get("search") as string });
  };

  return (
    <div className="flex gap-2">
      <SideBar />

      <div className="flex-1 pl-[260px]">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-3xl font-semibold mb-4">Employees</h1>
          <Link
            className="bg-[#025194] p-2 rounded text-white"
            to={"/employees/new"}
          >
            Add Employee
          </Link>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search employees..."
            className="p-2 border rounded w-64"
          />
          <button
            type="submit"
            className="bg-[#025194] text-white px-4 py-2 rounded"
          >
            Search
          </button>
        </form>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr className="bg-[#025194] text-white">
                <th className="py-3 px-4 text-left">Photo</th>
                <th className="py-3 px-4 text-left">Full Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Job Title</th>
                <th className="py-3 px-4 text-left">Department</th>
                <th className="py-3 px-4 text-left">Salary</th>
                <th className="py-3 px-4 text-left">Start Date</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee: any) => (
                <tr key={employee.id} className="border-b hover:bg-gray-100">
                  <td className="py-3 px-4">
                    <img
                      src={
                        employee.photo_path ? employee.photo_path : placeholder
                      }
                      alt={employee.full_name}
                      className="w-12 h-12 object-cover rounded-full"
                    />
                  </td>
                  <td className="py-3 px-4">{employee.full_name}</td>
                  <td className="py-3 px-4">{employee.email}</td>
                  <td className="py-3 px-4">{employee.job_title}</td>
                  <td className="py-3 px-4">{employee.department}</td>
                  <td className="py-3 px-4">
                    ${employee.salary.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {new Date(employee.start_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <Link to={`${employee.id}`}>
                      <FaRegEye
                        color="#025194"
                        size={20}
                        className="cursor-pointer"
                      />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center mt-4 gap-2">
          {currentPage > 1 && (
            <Link
              to={`?page=${currentPage - 1}${
                search ? `&search=${search}` : ""
              }`}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 bg-gray-200 rounded">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              to={`?page=${currentPage + 1}${
                search ? `&search=${search}` : ""
              }`}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

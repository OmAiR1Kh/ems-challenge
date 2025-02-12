import { FaRegEye } from "react-icons/fa";
import { Link, useLoaderData, useSearchParams } from "react-router";
import SideBar from "~/components/sidebar";
import { getDB } from "~/db/getDB";
import { useState } from "react";
import Calendar from "~/components/calendarView";

// export async function loader({ request }: { request: Request }) {
//   const db = await getDB();
//   const url = new URL(request.url);

//   // Pagination
//   const page = parseInt(url.searchParams.get("page") || "1", 10);
//   const pageSize = 4; // Timesheets per page
//   const offset = (page - 1) * pageSize;

//   // Filtering
//   const search = url.searchParams.get("search")?.trim().toLowerCase() || "";

//   // Get all column names dynamically
//   const columnsData = await db.all("PRAGMA table_info(timesheets)");
//   const columnNames = columnsData
//     .map((col: any) => col.name)
//     .filter((name: string) => name !== "id"); // Exclude `id`

//   let query = `
//     SELECT timesheets.*, employees.full_name AS employee_name
//     FROM timesheets
//     LEFT JOIN employees ON timesheets.employee_id = employees.id
//   `;
//   let params: any[] = [];

//   if (search) {
//     const searchConditions = columnNames
//       .map((col) => `LOWER(${col}) LIKE ?`)
//       .join(" OR ");
//     query += ` WHERE ${searchConditions}`;
//     params = Array(columnNames.length).fill(`%${search}%`);
//   }

//   query += " LIMIT ? OFFSET ?";
//   params.push(pageSize, offset);

//   // Get filtered + paginated timesheets
//   const timesheets = await db.all(query, params);

//   // Get total count for pagination
//   const totalTimesheetsQuery = `
//     SELECT COUNT(*) as count
//     FROM timesheets
//     LEFT JOIN employees ON timesheets.employee_id = employees.id
//     ${
//       search
//         ? `WHERE ${columnNames
//             .map((col) => `LOWER(${col}) LIKE ?`)
//             .join(" OR ")}`
//         : ""
//     }
//   `;
//   const totalTimesheets = await db.get(
//     totalTimesheetsQuery,
//     search ? Array(columnNames.length).fill(`%${search}%`) : []
//   );

//   return {
//     timesheets,
//     currentPage: page,
//     totalPages: Math.ceil(totalTimesheets.count / pageSize),
//     search,
//   };
// }

export async function loader({ request }: { request: Request }) {
  const db = await getDB();
  const url = new URL(request.url);

  // Pagination
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = 4; // Timesheets per page
  const offset = (page - 1) * pageSize;

  // Filtering
  const search = url.searchParams.get("search")?.trim().toLowerCase() || "";

  // Get all column names dynamically
  const columnsData = await db.all("PRAGMA table_info(timesheets)");
  const columnNames = columnsData
    .map((col: any) => col.name)
    .filter((name: string) => name !== "id"); // Exclude `id`

  let query = `
    SELECT timesheets.*, employees.full_name AS employee_name
    FROM timesheets
    LEFT JOIN employees ON timesheets.employee_id = employees.id
  `;
  let params: any[] = [];

  if (search) {
    const searchConditions = [
      ...columnNames.map((col) => `LOWER(${col}) LIKE ?`),
      `LOWER(employees.full_name) LIKE ?`, // Add search for employee name
    ].join(" OR ");

    query += ` WHERE ${searchConditions}`;
    params = Array(columnNames.length).fill(`%${search}%`);
    params.push(`%${search}%`); // Include search for employee name
  }

  query += " LIMIT ? OFFSET ?";
  params.push(pageSize, offset);

  // Get filtered + paginated timesheets
  const timesheets = await db.all(query, params);

  // Get total count for pagination
  const totalTimesheetsQuery = `
    SELECT COUNT(*) as count
    FROM timesheets
    LEFT JOIN employees ON timesheets.employee_id = employees.id
    ${
      search
        ? `WHERE ${columnNames
            .map((col) => `LOWER(${col}) LIKE ?`)
            .join(" OR ")} OR LOWER(employees.full_name) LIKE ?`
        : ""
    }
  `;
  const totalTimesheets = await db.get(
    totalTimesheetsQuery,
    search
      ? Array(columnNames.length).fill(`%${search}%`).concat(`%${search}%`)
      : []
  );

  return {
    timesheets,
    currentPage: page,
    totalPages: Math.ceil(totalTimesheets.count / pageSize),
    search,
  };
}

export default function TimesheetPage() {
  const { timesheets, currentPage, totalPages, search } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSearchParams({ search: formData.get("search") as string });
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "table" ? "calendar" : "table");
  };

  return (
    <div className="flex gap-2">
      <SideBar />

      <div className="flex-1 pl-[260px]">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-3xl font-semibold mb-4">Timesheets</h1>
          <Link
            className="bg-[#025194] p-2 rounded text-white"
            to={"/timesheets/new"}
          >
            Add Timesheet
          </Link>
          <button
            onClick={toggleViewMode}
            className="bg-[#025194] p-2 rounded text-white"
          >
            Switch to {viewMode === "table" ? "Calendar" : "Table"} View
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search timesheets..."
            className="p-2 border rounded w-64"
          />
          <button
            type="submit"
            className="bg-[#025194] text-white px-4 py-2 rounded"
          >
            Search
          </button>
        </form>

        {/* Conditional Rendering of Views */}
        {viewMode === "table" ? (
          // Table View
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-[#025194] text-white">
                  <th className="py-3 px-4 text-left">Employee</th>
                  <th className="py-3 px-4 text-left">Start Time</th>
                  <th className="py-3 px-4 text-left">End Time</th>
                  <th className="py-3 px-4 text-left">Summary</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map((timesheet: any) => (
                  <tr key={timesheet.id} className="border-b hover:bg-gray-100">
                    <td className="py-3 px-4">
                      {timesheet.employee_id} - {timesheet.employee_name}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(timesheet.start_time).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(timesheet.end_time).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{timesheet.summary}</td>
                    <td className="py-3 px-4">
                      <Link to={`${timesheet.id}`}>
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
        ) : (
          // Calendar View (Future enhancement for calendar integration)
          <div>
            <Calendar timesheets={timesheets} />
          </div>
        )}

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
          {viewMode == "table" && currentPage < totalPages && (
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

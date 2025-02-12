import { Link, NavLink } from "react-router";
import logo from "../welcome/logo.png";

const SideBar = () => {
  return (
    <ul className="w-[250px] h-[100vh] flex flex-col gap-3 border-r fixed bg-white">
      <img src={logo} alt="" />
      <li className="p-2 w-full text-center">
        <NavLink to={"/employees"}>Employees</NavLink>
      </li>
      <li className="p-2 w-full text-center">
        <NavLink to={"/timesheets"}>Timesheets</NavLink>
      </li>
    </ul>
  );
};

export default SideBar;

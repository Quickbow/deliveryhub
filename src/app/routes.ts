import { createBrowserRouter } from "react-router";
import { LandingPage } from "./views/LandingPage";
import { CustomerView } from "./views/CustomerView";
import { SellerView } from "./views/SellerView";
import { DeliveryView } from "./views/DeliveryView";
import { Login } from "./components/Login";
import { SignUp } from "./components/SignUp";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      Component: LandingPage,
    },
    {
      path: "/login",
      Component: Login,
    },
    {
      path: "/signup",
      Component: SignUp,
    },
    {
      path: "/customer",
      Component: CustomerView,
    },
    {
      path: "/seller",
      Component: SellerView,
    },
    {
      path: "/delivery",
      Component: DeliveryView,
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
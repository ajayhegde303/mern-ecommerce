import React from 'react';
import { useSelector } from 'react-redux';
import {
  Navigate,
  Route, RouterProvider, createBrowserRouter, createRoutesFromElements
} from "react-router-dom";
import { selectIsAuthChecked, selectLoggedInUser } from './features/auth/AuthSlice';
import { Logout } from './features/auth/components/Logout';
import { Protected } from './features/auth/components/Protected';
import { useAuthCheck } from "./hooks/useAuth/useAuthCheck";
import { useFetchLoggedInUserDetails } from "./hooks/useAuth/useFetchLoggedInUserDetails";
import { AddProductPage, AdminOrdersPage, CartPage, CheckoutPage, ForgotPasswordPage, HomePage, LoginPage, OrderSuccessPage, OtpVerificationPage, ProductDetailsPage, ProductUpdatePage, ResetPasswordPage, SignupPage, UserOrdersPage, UserProfilePage, WishlistPage } from './pages';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Move router creation outside to prevent recreation on every render
// Note: We need access to loggedInUser for conditional routes.
// However, creating the router statically means we can't easily switch based on user state 
// UNLESS we use a layout route/wrapper for admin checks.
// But the current implementation uses `loggedInUser?.isAdmin` at the top level of route creation.
// To keep things simple but stable, we can use `useMemo` inside the component.

function App() {

  const isAuthChecked = useSelector(selectIsAuthChecked)
  const loggedInUser = useSelector(selectLoggedInUser)

  useAuthCheck();
  useFetchLoggedInUserDetails(loggedInUser);

  // We need to recreate the router ONLY when loggedInUser state changes (specifically isAdmin status)
  // This prevents recreation on every unrelated state update.
  const routes = React.useMemo(() => createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path='/signup' element={<SignupPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/verify-otp' element={<OtpVerificationPage />} />
        <Route path='/forgot-password' element={<ForgotPasswordPage />} />
        <Route path='/reset-password/:userId/:passwordResetToken' element={<ResetPasswordPage />} />
        <Route exact path='/logout' element={<Protected><Logout /></Protected>} />
        <Route exact path='/product-details/:id' element={<Protected><ProductDetailsPage /></Protected>} />

        {
          loggedInUser?.isAdmin ? (
            // admin routes
            <>
              <Route path='/admin/dashboard' element={<Protected><AdminDashboardPage /></Protected>} />
              <Route path='/admin/product-update/:id' element={<Protected><ProductUpdatePage /></Protected>} />
              <Route path='/admin/add-product' element={<Protected><AddProductPage /></Protected>} />
              <Route path='/admin/orders' element={<Protected><AdminOrdersPage /></Protected>} />
              <Route path='*' element={<Navigate to={'/admin/dashboard'} />} />
            </>
          ) : (
            // user routes
            <>
              <Route path='/' element={<Protected><HomePage /></Protected>} />
              <Route path='/cart' element={<Protected><CartPage /></Protected>} />
              <Route path='/profile' element={<Protected><UserProfilePage /></Protected>} />
              <Route path='/checkout' element={<Protected><CheckoutPage /></Protected>} />
              <Route path='/order-success/:id' element={<Protected><OrderSuccessPage /></Protected>} />
              <Route path='/orders' element={<Protected><UserOrdersPage /></Protected>} />
              <Route path='/wishlist' element={<Protected><WishlistPage /></Protected>} />
            </>
          )
        }

        <Route path='*' element={<NotFoundPage />} />

      </>
    )
  ), [loggedInUser]); // Dependency on loggedInUser


  return isAuthChecked ? <RouterProvider router={routes} /> : "";
}

export default App;

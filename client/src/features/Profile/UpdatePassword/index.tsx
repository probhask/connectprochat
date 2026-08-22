import { Button, Stack, Typography } from "@mui/material";
import { useEffect, useRef } from "react";

import { ChangePasswordFormValidation } from "@utils/validation";
import { Formik } from "formik";
import InputTextfield from "@components/Forms/InputTextfield";
import { useNavigate } from "react-router-dom";
import useProfileContext from "@context/ProfileContext";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const { handleUpdatePassword, updatePasswordLoading, updatePasswordError } =
    useProfileContext();

  // Track whether a submit here actually caused the in-flight mutation,
  // so a success elsewhere (or a stale error from a previous visit)
  // doesn't navigate away on this screen.
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current && !updatePasswordLoading && !updatePasswordError) {
      submittedRef.current = false;
      setTimeout(() => navigate(-1), 1000);
    }
  }, [updatePasswordLoading, updatePasswordError, navigate]);

  return (
    <Stack
      sx={{
        backgroundColor: "transparent",
        color: "inherit",
      }}
    >
      <Typography
        variant="h4"
        sx={{ fontWeight: 600, mb: 5, fontSize: { xs: "2rem" } }}
      >
        Update Your Account Details
      </Typography>
      <Formik
        initialValues={{ password: "", newPassword: "", confirmPassword: "" }}
        validationSchema={ChangePasswordFormValidation}
        validateOnChange={true}
        onSubmit={(values, { setSubmitting }) => {
          if (values.password && values.newPassword) {
            submittedRef.current = true;
            handleUpdatePassword(values.password, values.newPassword);
          }
          setSubmitting(false);
        }}
      >
        {({
          values,
          errors,
          handleChange,
          handleSubmit,
          handleBlur,
          touched,
          isSubmitting,
        }) => (
          <form onSubmit={handleSubmit}>
            <Stack
              sx={{
                rowGap: 2,
              }}
            >
              <InputTextfield
                id="password"
                label="Password"
                variant="standard"
                placeholder="Enter your password"
                name="password"
                type="password"
                error={errors.password}
                isTouched={touched.password}
                value={values.password}
                handleChange={handleChange}
                handleBlur={handleBlur}
              />
              <InputTextfield
                variant="standard"
                id="newPassword"
                label="New Password"
                placeholder="Enter your new password"
                name="newPassword"
                type="password"
                value={values.newPassword}
                error={errors.newPassword}
                isTouched={touched.newPassword}
                handleChange={handleChange}
                handleBlur={handleBlur}
              />
              <InputTextfield
                variant="standard"
                id="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm Password"
                name="confirmPassword"
                type="password"
                value={values.confirmPassword}
                error={errors.confirmPassword}
                isTouched={touched.confirmPassword}
                handleChange={handleChange}
                handleBlur={handleBlur}
              />

              <Button
                type="submit"
                disabled={isSubmitting || updatePasswordLoading}
                sx={{
                  mt: 4,
                  color: "var(--color-light)",
                  backgroundColor: "var(--color-bg-primary)",
                }}
              >
                {isSubmitting || updatePasswordLoading
                  ? "Updating ..."
                  : "Update"}
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Stack>
  );
};

export default UpdatePassword;

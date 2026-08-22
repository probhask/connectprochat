import { Button, Stack, Typography } from "@mui/material";
import { useEffect, useRef } from "react";

import { Formik } from "formik";
import InputTextfield from "@components/Forms/InputTextfield";
import { UpdatePersonalDataFormValidation } from "@utils/validation";
import { useChatAppSelector } from "@store/hooks";
import { useNavigate } from "react-router-dom";
import useProfileContext from "@context/ProfileContext";

const UpdatePersonalData = () => {
  const navigate = useNavigate();
  const user = useChatAppSelector((store) => store.auth);
  const {
    handleUpdateProfileData,
    updateProfileLoading,
    updateProfileError,
  } = useProfileContext();

  // Track whether a submit here actually caused the in-flight mutation,
  // so a success elsewhere (or a stale error from a previous visit)
  // doesn't navigate away/toast on this screen.
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current && !updateProfileLoading && !updateProfileError) {
      submittedRef.current = false;
      setTimeout(() => navigate(-1), 1000);
    }
  }, [updateProfileLoading, updateProfileError, navigate]);

  return (
    <Stack
      sx={{
        backgroundColor: "transparent",
        color: "inherit",
        paddingBlock: "20px",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 600,
          fontSize: { xs: "2rem" },
          marginBottom: 6,
        }}
      >
        Update Your Account Details
      </Typography>
      <Formik
        initialValues={{ username: user.username, email: user.email }}
        validationSchema={UpdatePersonalDataFormValidation}
        validateOnChange={true}
        enableReinitialize={true}
        onSubmit={(values, { setSubmitting }) => {
          if (
            values.username !== user.username ||
            values.email !== user.email
          ) {
            submittedRef.current = true;
            handleUpdateProfileData(values.username, values.email);
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
                id="username"
                label="User Name"
                variant="standard"
                placeholder="User Name"
                name="username"
                error={errors.username}
                isTouched={touched.username}
                value={values.username}
                handleChange={handleChange}
                handleBlur={handleBlur}
              />
              <InputTextfield
                variant="standard"
                id="email"
                label="Email"
                placeholder="Email Address"
                name="email"
                value={values.email}
                error={errors.email}
                isTouched={touched.email}
                handleChange={handleChange}
                handleBlur={handleBlur}
              />

              <Button
                type="submit"
                disabled={isSubmitting || updateProfileLoading}
                sx={{
                  mt: 4,
                  color: "#fff",
                  backgroundColor: "var(--color-bg-primary)",
                }}
              >
                {isSubmitting || updateProfileLoading
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

export default UpdatePersonalData;

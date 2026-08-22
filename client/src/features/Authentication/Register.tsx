import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  styled,
} from "@mui/material";

import { Formik } from "formik";
import { Link } from "react-router-dom";
import { RegisterFormValidationSchema } from "@utils/validation";
import useAuthentication from "@hooks/useAuthentication";

const Register = () => {
  const { handleRegister, registerLoading } = useAuthentication();

  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 500,
          textAlign: "center",
          color: "var(--color-light)",
          mb: 4,
        }}
      >
        Register
      </Typography>
      <Formik
        initialValues={{ username: "", email: "", password: "" }}
        validationSchema={RegisterFormValidationSchema}
        validateOnChange={true}
        onSubmit={(values, { setSubmitting }) => {
          handleRegister(values.username, values.email, values.password);
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
            <Stack spacing={2}>
              <Box sx={{ width: "100%" }}>
                <StyledTextField
                  id="username"
                  label="User Name"
                  variant="outlined"
                  placeholder="User Name"
                  autoComplete="username"
                  value={values.username}
                  name="username"
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.username && errors.username && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "12px",
                      mt: "3px",
                      ml: "5px",
                      fontWeight: "500",
                      color: "var(--color-danger)",
                    }}
                  >
                    {errors.username}
                  </Typography>
                )}
              </Box>
              <Box>
                <StyledTextField
                  id="email"
                  label="Email"
                  variant="outlined"
                  placeholder="Email Address"
                  autoComplete="email"
                  value={values.email}
                  name="email"
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.email && errors.email && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "12px",
                      mt: "3px",
                      ml: "5px",
                      fontWeight: "500",
                      color: "var(--color-danger)",
                    }}
                  >
                    {errors.email}
                  </Typography>
                )}
              </Box>
              <Box>
                <StyledTextField
                  id="password"
                  label="Password"
                  autoComplete="password"
                  type="password"
                  variant="outlined"
                  placeholder="Enter Password"
                  value={values.password}
                  name="password"
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.password && errors.password && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "12px",
                      mt: "3px",
                      ml: "5px",
                      fontWeight: "500",
                      color: "var(--color-danger)",
                    }}
                  >
                    {errors.password}
                  </Typography>
                )}
              </Box>

              <Button
                type="submit"
                disabled={isSubmitting || registerLoading}
                sx={{
                  color: "var(--color-light)",
                  backgroundColor: "var(--color-dark)",
                  ":disabled": {
                    backgroundColor: "var(--color-dark)",
                    color: "var(--color-light)",
                  },
                }}
              >
                {isSubmitting || registerLoading ? "creating..." : "Register"}
              </Button>
            </Stack>
            <Box sx={{ mt: 1 }}>
              <Box>
                <Typography component="span">
                  Already have an account ?
                </Typography>
                <Link to="/auth/login" className="text-blue-500 ml-2">
                  Login
                </Link>
              </Box>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  );
};

export default Register;

const StyledTextField = styled(TextField)({
  accentColor: "var(--color-danger)",
  caretColor: "var(--color-light)",
  width: "100%",
  // overflow: "hidden",
  "& .MuiOutlinedInput-root": {
    // backgroundColor: "var(--color-accent-primary)",

    "& fieldset": {
      borderColor: "var(--color-light)",
      colors: "var(--color-light)",
    },
    "&:hover fieldset": {
      borderColor: "var(--color-light)",
      color: "var(--color-light)",
    },
    "& .Mui-focused fieldset": {
      borderColor: "var(--color-danger)",
      color: "var(--color-light)",
    },
    "& input": {
      // backgroundColor: "var(--color-light)",
      color: "var(--color-light)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "var(--color-light)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "var(--color-light)",
  },
});

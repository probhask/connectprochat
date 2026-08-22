import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  styled,
} from "@mui/material";
import { Handshake, Search } from "@mui/icons-material";

import { NavLink } from "react-router-dom";

const navbarLinks: { path: string; displayName: string }[] = [
  {
    path: "",
    displayName: "Home",
  },
  {
    path: "/about",
    displayName: "About",
  },

  {
    path: "/explore",
    displayName: "Explore",
  },
  {
    path: "/category",
    displayName: "category",
  },
  {
    path: "/contact",
    displayName: "Contact",
  },
];

const StyledToolbar = styled(Toolbar)({
  display: "flex",
  justifyContent: "space-between",
});
const LogoBox = styled(Box)({
  display: "block",
});
const NavBarLinks = styled(Box)(({ theme }) => ({
  backgroundColor: "inherit",
  display: "none",
  flex: 1,
  textTransform: "capitalize",
  maxWidth: 500,
  justifyContent: "space-evenly",
  color: "var(--color-light)",
  [theme.breakpoints.up("sm")]: {
    display: "flex",
  },
}));

const Header = () => {
  return (
    <AppBar
      position="sticky"
      color="secondary"
      sx={{ top: 0, left: 0, right: 0 }}
    >
      <StyledToolbar>
        {/* logo */}
        <LogoBox>
          <Typography
            variant="h6"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            NAMASTE READER
          </Typography>
          <IconButton sx={{ display: { xs: "block", sm: "none" } }}>
            <Handshake />
          </IconButton>
        </LogoBox>

        {/* navbarLink */}
        <NavBarLinks>
          {navbarLinks.map(({ displayName, path }) => (
            <NavLink key={path} to={path}>
              {displayName}
            </NavLink>
          ))}
        </NavBarLinks>
        {/* search icon */}
        <IconButton>
          <Search />
        </IconButton>
      </StyledToolbar>
    </AppBar>
  );
};

export default Header;

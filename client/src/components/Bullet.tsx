import makeStyles from "@material-ui/core/styles/makeStyles";
import * as React from "react";

const useStyles = makeStyles({
  root: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)",
  },
});

export const Bullet: React.FunctionComponent = () => {
  const classes = useStyles();

  return <span className={classes.root}>•</span>;
};

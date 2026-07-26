import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useStore from "hooks/useStore";
import PageTransition from "components/common/PageTransition";
import clsx from "clsx";

import s from "./Layout.module.scss";

const Layout = ({ children }) => {
  const router = useRouter();

  return <PageTransition>{children}</PageTransition>;
};

export default React.memo(Layout);

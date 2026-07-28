import React from "react";
import s from "./Home.module.scss";

const Home = () => {
  return (
    <div className={s.root}>
      <div className={s.wrapper}>
        <div className={s.header}>
          <h1>Home</h1>
        </div>
      </div>
    </div>
  );
};

export default Home;

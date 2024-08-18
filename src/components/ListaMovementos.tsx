import React from "react";
import { Link } from "react-router-dom";
import "../ListaMovimentos.css";

const ListaMovementos = () => {
  return (
    <>
      <Link to="/" className="buttons">
        <button className="footerButton">Back</button>
      </Link>
      <div className="inDevelopment">EM DESENVOLVIMENTO</div>
    </>
  );
};

export default ListaMovementos;

import React from "react";
import "../components/Menu.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGavel } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

const Menu = () => {
  const handleBattleClick = () => {
    console.log("/rota-de-batalha");
  };

  return (
    <div className="option-carousel Menu">
      <Link to="/batalha" className="buttons">
        <button onClick={handleBattleClick} title="Iniciar Batalha">
          <FontAwesomeIcon icon={faGavel} />
        </button>
      </Link>
    </div>
  );
};

export default Menu;

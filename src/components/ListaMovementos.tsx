import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../src/ListaMovimentos.css";
import DataGrid, {
  Column,
  Export,
  Pager,
  Paging,
} from "devextreme-react/data-grid";
import { Workbook } from "exceljs";
import saveAs from "file-saver";
import { exportDataGrid } from "devextreme/excel_exporter";

const firstUrl = "https://pokeapi.co/api/v2/pokemon";
const maxPokemonIndex = 387;
const pagesPerLoad = 7;
const pokemonsPerPage = 20;

interface IPokemon {
  name: string;
  url: string;
}

interface IPokemonMove {
  attackName: string;
  moveType: string;
  power: number;
}

interface IPokemonDetails {
  pokemonNumber: number;
  pokemonName: string;
  pokemonMoves: IPokemonMove[];
}

const ListaMovementos = () => {
  const [allPokemonData, setAllPokemonData] = useState<IPokemonDetails[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string | null>(firstUrl);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPreviousVisible, setIsPreviousVisible] = useState(false);

  const fetchPokemonDetails = async (
    pokemonList: IPokemon[],
    startIndex: number
  ) => {
    const pokemonDetails = await Promise.all(
      pokemonList.map(async (pokemon, index) => {
        const pokemonIndex = startIndex + index;

        if (pokemonIndex > maxPokemonIndex) {
          return null;
        }

        const response = await fetch(pokemon.url);
        const data = await response.json();

        const moveTypesMap: Record<
          string,
          { moveName: string; power: number }
        > = {};

        for (const move of data.moves) {
          const isLevelUp = move.version_group_details.some(
            (detail: any) => detail.move_learn_method.name === "level-up"
          );

          if (isLevelUp) {
            const moveResponse = await fetch(move.move.url);
            const moveData = await moveResponse.json();

            if (moveData.power && moveData.power > 0) {
              const moveType = moveData.type.name;
              const moveName = moveData.name;
              let adjustedPower = Math.ceil(moveData.power / 10);

              if (adjustedPower > 10) {
                adjustedPower = 10;
              }

              if (adjustedPower <= 6) {
                adjustedPower = 8;
              }

              if (adjustedPower === 7) {
                adjustedPower = 8;
              }

              if (
                !moveTypesMap[moveType] ||
                moveTypesMap[moveType].power < adjustedPower
              ) {
                moveTypesMap[moveType] = { moveName, power: adjustedPower };
              }
            }
          }
        }

        const pokemonMoves = Object.entries(moveTypesMap).map(
          ([type, { moveName, power }]) => ({
            attackName: moveName,
            moveType: type,
            power: power,
          })
        );

        return {
          pokemonNumber: pokemonIndex + 1,
          pokemonName: data.name,
          pokemonMoves,
        };
      })
    );

    return pokemonDetails.filter(
      (pokemon): pokemon is IPokemonDetails => pokemon !== null
    );
  };

  const loadPokemonPages = async (url: string | null) => {
    if (!url) return;

    let currentLoadUrl = url;
    let currentLoadPage = 0;
    let allLoadedData: IPokemonDetails[] = [];

    while (currentLoadUrl && currentLoadPage < pagesPerLoad) {
      const response = await fetch(currentLoadUrl);
      const data = await response.json();
      const pokemonDetails = await fetchPokemonDetails(
        data.results,
        currentPage * pagesPerLoad * pokemonsPerPage +
          currentLoadPage * pokemonsPerPage
      );
      allLoadedData = [...allLoadedData, ...pokemonDetails];
      currentLoadUrl = data.next;
      currentLoadPage++;
    }

    setAllPokemonData(allLoadedData);
    setCurrentUrl(currentLoadUrl);
    setIsPreviousVisible(currentPage > 0);

    /* console.log(allLoadedData); */ // Loga o objeto final
  };

  useEffect(() => {
    loadPokemonPages(currentUrl);
  }, [currentPage]);

  const handleNext = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handlePrevious = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
  };

  // Função para exportar a tabela para Excel
  const onExporting = (e: any) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("PokemonData");

    exportDataGrid({
      component: e.component,
      worksheet: worksheet,
      autoFilterEnabled: true,
      customizeCell: (options: { gridCell?: any; excelCell?: any }) => {
        const { gridCell, excelCell } = options;
        if (
          gridCell?.column?.dataField === "pokemonMoves" &&
          Array.isArray(gridCell.value)
        ) {
          excelCell.value = gridCell.value
            .map(
              (move: IPokemonMove) =>
                `(${move.attackName} / ${move.moveType} / ${move.power})`
            )
            .join(", ");
        }
      },
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer: any) => {
        saveAs(
          new Blob([buffer], { type: "application/octet-stream" }),
          "PokemonData.xlsx"
        );
      });
    });
    e.cancel = true; // Impede o comportamento padrão da exportação
  };

  return (
    <>
      <Link to="/" className="buttons">
        <button className="footerButton">Back</button>
      </Link>
      <div className="pokemon-moves-list">
        <button onClick={handleNext} className="footerButton">
          Next
        </button>
        {isPreviousVisible && (
          <button onClick={handlePrevious} className="footerButton">
            Previous
          </button>
        )}
      </div>
      {/* DataGrid para exibir os dados dos Pokémons */}
      <DataGrid
        dataSource={allPokemonData}
        showBorders={true}
        onExporting={onExporting}
        columnAutoWidth={true} // Garantir que as colunas sejam dimensionadas automaticamente
        rowAlternationEnabled={true} // Alternar as cores das linhas para facilitar a leitura
        export={{ enabled: true }} // Habilitar a exportação na grade
      >
        <Paging defaultPageSize={20} />
        <Pager showPageSizeSelector={true} allowedPageSizes={[20, 50, 100]} />

        <Column dataField="pokemonNumber" caption="Number" width={70} />
        <Column dataField="pokemonName" caption="Name" />
        <Column
          dataField="pokemonMoves"
          caption="Moves"
          customizeText={(cellInfo) => {
            const moves = cellInfo.value as IPokemonMove[];
            return moves
              .map(
                (move) =>
                  `(${move.attackName} / ${move.moveType} / ${move.power})`
              )
              .join(", ");
          }}
        />

        <Export enabled={true} />
      </DataGrid>
    </>
  );
};

export default ListaMovementos;

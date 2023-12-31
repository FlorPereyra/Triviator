import { useState } from 'react';
import { Wheel } from 'react-custom-roulette';
import "./_ruleta.scss";
import { useNavigate } from 'react-router-dom';

const data = [
  { id: 1, option: 'Disney' },
  { id: 2, option: 'Cine Argentino' },
  { id: 3, option: 'Ficción' },
  { id: 4, option: 'Marvel' },
  { id: 5, option: 'Caricaturas' },
  { id: 6, option: 'Romance' }
];

export const Ruleta = () => {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber] = useState(0);
  const navigate = useNavigate();

  const handleSpinClick = () => {
    if (!mustSpin) {
      setMustSpin(true);
      }
  };

  return (
    <>
      <Wheel 
        mustStartSpinning={mustSpin}
        prizeNumber={prizeNumber}
        data={data}
        backgroundColors={['#BC7AF9']}
        textColors={["white"]}
        radiusLineWidth={2}
        outerBorderWidth={2}
        onStopSpinning={() => {
          setMustSpin(false);
          // Imprimir la categoría seleccionada en la consola
          console.log("Categoría seleccionada:", data[prizeNumber].option);
          navigate(`/PaginaJuego/`);
        }}
      />
      <button className='boton' onClick={handleSpinClick}>GIRAR</button>
    </>
  );
};

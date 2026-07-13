const rutaInput = document.getElementById("rutaInput");
const btnSeleccionar = document.getElementById("btnSeleccionar");
const btnCrear = document.getElementById("btnCrear");
const mensaje = document.getElementById("mensaje");
let rutaSeleccionada = null;

btnSeleccionar.addEventListener("click", async () => {
  const ruta = await window.api.seleccionarCarpeta();
  if (ruta) {
    rutaSeleccionada = ruta;
    rutaInput.value = ruta;
    btnCrear.disabled = false;
    mensaje.textContent = "";
  }
});

btnCrear.addEventListener("click", async () => {
  if (!rutaSeleccionada) return;
  btnCrear.disabled = true;
  btnCrear.textContent = "Procesando...";
  mensaje.textContent = "";
  mensaje.className = "";

  const resultado = await window.api.crearOAbrirBoveda(rutaSeleccionada);

  if (resultado.ok) {
    mensaje.textContent = resultado.existente
      ? `Bóveda existente cargada: ${resultado.ruta}`
      : `Bóveda creada en: ${resultado.ruta}`;
    mensaje.className = "exito";
    btnCrear.textContent = resultado.existente ? "Bóveda abierta" : "Bóveda creada";

    setTimeout(() => {
      window.location.href = "../index.html";
    }, 1200);
  } else {
    mensaje.textContent = resultado.error;
    mensaje.className = "error";
    btnCrear.disabled = false;
    btnCrear.textContent = "Crear bóveda";
  }
});
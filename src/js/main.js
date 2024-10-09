// Importación de los 
import '../scss/styles.scss'
import '../scss/styles_control_panel.scss'
import '../scss/styles_header.scss'
import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCalculator from '@kitware/vtk.js/Filters/General/Calculator';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkWebXRRenderWindowHelper from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper'; // gestiona las funcionalidades de realidad virtual (VR) y realidad aumentada (AR) 
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract'; // Este es para la funcionalidad de AR para definir si hay un dispositivo especifico o mobile AR
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader'; // Este es para poder cargar los archivos .vtps
import vtkResourceLoader from '@kitware/vtk.js/IO/Core/ResourceLoader'; // Este módulo se encarga de cargar recursos, como scripts aqui carga un "polyfill" para navegadores que no soportan WebXR 
import { AttributeTypes } from '@kitware/vtk.js/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from '@kitware/vtk.js/Common/DataModel/DataSet/Constants';
import { XrSessionTypes } from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper/Constants';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';



// Aqui vienen los botones para manejar las seciones


// Cargar el polyfill de WebXR si es necesario
// Dynamically load WebXR polyfill from CDN for WebVR and Cardboard API backwards compatibility
if (navigator.xr === undefined) {
  vtkResourceLoader
    .loadScript(
      'https://cdn.jsdelivr.net/npm/webxr-polyfill@latest/build/webxr-polyfill.js'
    )
    .then(() => {
      // eslint-disable-next-line no-new, no-undef
      new WebXRPolyfill();
    });
}

// Definir colores para los actores
const color_rgb = [
  [1.0, 0.0, 0.0],    // Rojo
  [1.0, 0.56, 0.94],  // Rosa
  [0.0, 1.0, 0.0],    // Verde
  [0.0, 0.0, 1.0],    // Azul
  [2.55, 1.65, 0.0],  // Naranja
  [1.02, 0.0, 1.61],  // Morado
];

// Ruta base para los archivos VTP
const vtp_path = "./vtps/";

// Array con las rutas de los archivos VTP
const vtpFiles = [
  vtp_path + 'cow.vtp',
  vtp_path + 'earth.vtp',
  vtp_path + 'estructura.vtp',
  vtp_path + 'estructura_1.vtp',
  vtp_path + 'estructura_2.vtp',
  vtp_path + 'estructura_3.vtp',
];

// ----------------------------------------------------------------------------
// Parse URL parameters (para saber si es AR o VR)
// ----------------------------------------------------------------------------
const userParams = vtkURLExtract.extractURLParameters();
const requestedXrSessionType =
  userParams.xrSessionType ?? XrSessionTypes.MobileAR; // Si no se define, se asume MobileAR

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  rootContainer: document.getElementById('container'),
  containerStyle: { width: '100%', height: '100%' },
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const XRHelper = vtkWebXRRenderWindowHelper.newInstance({
  renderWindow: fullScreenRenderer.getApiSpecificRenderWindow(),
});

// Array para almacenar los actores (objetos 3D) cargados en la escena
const actors = [];

// Función para cargar archivos VTP
function loadVTP() {
    vtpFiles.forEach((file, index) => {
        console.log("file: " + file + " index: " + index); // para ver cómo se están cargando los vtp
        const reader = vtkXMLPolyDataReader.newInstance();
        const mapper = vtkMapper.newInstance();
        const actor = vtkActor.newInstance();

        actor.setMapper(mapper);
        actor.getProperty().setColor(color_rgb[index]);
        actor.getProperty().setOpacity(1.0);

        mapper.setInputConnection(reader.getOutputPort());

        reader.setUrl(file).then(() => {
            reader.loadData().then(() => {
                renderer.addActor(actor);
                actors[index] = actor;

                renderer.resetCamera();
                renderWindow.render();
            });
        }).catch((error) => {
            console.error(`Error al cargar el archivo VTP: ${file}`, error);
        });
    });
}

// Función para generar el contenido del panel de control dinámicamente
function generateControlPanel() {
  const vrbtn = document.createElement('button');
  vrbtn.id = "btn-vr";
  vrbtn.className = "vrbutton";
  vrbtn.textContent = "Send To VR";

  const arbtn = document.createElement('button');
  arbtn.id = "btn-ar";
  arbtn.className = "arbutton";
  arbtn.textContent = "Send To AR";

  const modeSelector = document.createElement('select');
  modeSelector.value = 2;
  modeSelector.id = "selec";
  modeSelector.className = "representations";
  
  const optPoits = document.createElement("option");
  optPoits.value = 0;
  optPoits.text = "Points";
  modeSelector.appendChild(optPoits);

  const optWireFrame = document.createElement("option");
  optWireFrame.value = 1;
  optWireFrame.text = "Wireframe";
  modeSelector.appendChild(optWireFrame);

  const optSurface = document.createElement("option");
  optSurface.value = 2;
  optSurface.text = "Surface";
  modeSelector.appendChild(optSurface);


  const controlPanel = document.getElementById("controlPanel");
  controlPanel.appendChild(arbtn);
  controlPanel.appendChild(vrbtn);
  controlPanel.appendChild(modeSelector);
  controlPanel.appendChild(document.createElement('br'));


  vtpFiles.forEach((file, index) => {
  
    const checkbox = document.createElement('input'); // tipo de entrada input tipo checkbox
    checkbox.type = 'checkbox';
    checkbox.id = `checkboxVTP-${index}`;
    checkbox.checked = true;

    const label = document.createElement('label');
    label.htmlFor = `checkboxVTP-${index}`;
    label.textContent = `Mostrar ${file.split('/').pop()}`;

    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.id = `opacityVTP-${index}`;
    opacitySlider.min = "0";
    opacitySlider.max = "1";
    opacitySlider.step = "0.1";
    opacitySlider.value = "1";

    const opacityLabel = document.createElement('label');
    opacityLabel.htmlFor = `opacityVTP-${index}`;
    opacityLabel.textContent = ` Opacidad de ${file.split('/').pop()}: `;

    controlPanel.appendChild(checkbox);
    controlPanel.appendChild(label);
    controlPanel.appendChild(document.createElement('br'));
    controlPanel.appendChild(opacityLabel);
    controlPanel.appendChild(opacitySlider);
    controlPanel.appendChild(document.createElement('br'));
    controlPanel.appendChild(document.createElement('br'));

  });
}



// Función para crear controladores de eventos para el panel de control
function createControlEvents() {
  vtpFiles.forEach((_, index) => {
      const checkbox = document.getElementById(`checkboxVTP-${index}`);
      checkbox.addEventListener('change', (event) => {
          const actor = actors[index];
          if (event.target.checked) {
              renderer.addActor(actor);
          } else {
              renderer.removeActor(actor);
          }
          renderer.resetCamera();
          renderWindow.render();
      });

      const opacitySlider = document.getElementById(`opacityVTP-${index}`);
      opacitySlider.addEventListener('input', (event) => {
          const actor = actors[index];
          actor.getProperty().setOpacity(Number(event.target.value));
          renderWindow.render();
      });
  });
}

generateControlPanel();
const controlPanel = document.getElementById("controlPanel");


fullScreenRenderer.addController(controlPanel);

// Botón para sesion AR
const arbutton = document.querySelector('.arbutton');
arbutton.disabled = !XRHelper.getXrSupported();

arbutton.addEventListener('click', (e) => {
  if (arbutton.textContent === 'Start AR') {
    XRHelper.startXR(XrSessionTypes.MobileAR); // Inicia sesión en AR
    arbutton.textContent = 'Exit AR';
  } else {
    XRHelper.stopXR();
    arbutton.textContent = 'Start AR';
  }
});

// Botón para sesion VR
const vrbutton = document.querySelector('.vrbutton');
vrbutton.addEventListener('click', (e) => {
  if (vrbutton.textContent === 'Send To VR') {
    //console.log("Test: " + navigator.xr)  // pruebas
    XRHelper.startXR(XrSessionTypes.HmdVR); // Inicia sesión en VR
    vrbutton.textContent = 'Return From VR';
  } else {
    XRHelper.stopXR();
    vrbutton.textContent = 'Send To VR';
  }
  console.log("Botón clickeado"); // pruebas
});

// Selector de representación (Points, Wireframe, Surface)
const representationSelector = document.querySelector('.representations');
representationSelector.addEventListener('change', (e) => {
  const newRepValue = Number(e.target.value);
  actors.forEach((actor) => {
    actor.getProperty().setRepresentation(newRepValue); // Cambia la representación
  });
  renderWindow.render();
});

// -----------------------------------------------------------
// Ejecutar funciones para cargar VTPs y configurar controles
// -----------------------------------------------------------
loadVTP();
createControlEvents();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------


global.renderer = renderer;
global.renderWindow = renderWindow;

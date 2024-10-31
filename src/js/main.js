// Importación de los 
import '../scss/styles.scss';
import '../scss/styles_control_panel.scss';
import '../scss/styles_header.scss';
import '@kitware/vtk.js/favicon';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkWebXRRenderWindowHelper from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
import vtkResourceLoader from '@kitware/vtk.js/IO/Core/ResourceLoader';
import { XrSessionTypes } from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper/Constants';

import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

// Cargar el polyfill de WebXR si es necesario
if (navigator.xr === undefined) {
  vtkResourceLoader.loadScript(
    'https://cdn.jsdelivr.net/npm/webxr-polyfill@latest/build/webxr-polyfill.js'
  ).then(() => {
    new WebXRPolyfill();
  });
}

// Parse URL parameters (para saber si es AR o VR)
const userParams = vtkURLExtract.extractURLParameters();
const requestedXrSessionType =
  userParams.xrSessionType ?? XrSessionTypes.MobileAR; // Si no se define, se asume MobileAR


const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  rootContainer: document.getElementById('container'),
  containerStyle: { width: '100%', height: '100%' },
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const XRHelper = vtkWebXRRenderWindowHelper.newInstance({
  renderWindow: fullScreenRenderer.getApiSpecificRenderWindow(),
});

const vtpPath = "./vtps/cow.vtp";

function loadVTP() {
  const reader = vtkXMLPolyDataReader.newInstance();
  const mapper = vtkMapper.newInstance();
  const actor = vtkActor.newInstance();

  actor.setMapper(mapper);
  mapper.setInputConnection(reader.getOutputPort());

  reader.setUrl(vtpPath).then(() => {
    reader.loadData().then(() => {
      renderer.addActor(actor);
      renderer.resetCamera();
      renderWindow.render();
    });
  }).catch((error) => {
    console.error(`Error al cargar el archivo VTP: ${vtpPath}`, error);
  });
}

// Configuración para el botón AR
const arbutton = document.querySelector('.arbutton');
arbutton.disabled = !XRHelper.getXrSupported();

arbutton.addEventListener('click', () => {
  if (arbutton.textContent === 'Modo AR') {
    XRHelper.startXR(XrSessionTypes.MobileAR); // Inicia sesión AR
    arbutton.textContent = 'Salir de AR';
    arbutton.classList.add('active');
   
  } else {
    XRHelper.stopXR();
    arbutton.textContent = 'Modo AR';
    arbutton.classList.remove('active');
    
  }
});

// Configuración para el botón VR
const vrbutton = document.querySelector('.vrbutton');
vrbutton.addEventListener('click', () => {
  if (vrbutton.textContent === 'Modo VR') {
    XRHelper.startXR(XrSessionTypes.HmdVR); // Inicia sesión VR
    vrbutton.textContent = 'Salir de VR';
    vrbutton.classList.add('active');
    
  } else {
    XRHelper.stopXR();
    vrbutton.textContent = 'Modo VR';
    vrbutton.classList.remove('active');
    
  }
});


loadVTP();

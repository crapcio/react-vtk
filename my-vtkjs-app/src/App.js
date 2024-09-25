import { useState, useRef, useEffect } from 'react';

import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';

import vtkActor           from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper          from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSphereSource    from '@kitware/vtk.js/Filters/Sources/SphereSource';  // Изменено на vtkSphereSource

function App() {
  const vtkContainerRef = useRef(null);
  const context = useRef(null);
  const [sphereResolution, setSphereResolution] = useState(16); // Это для сегментов долготы/широты
  const [representation, setRepresentation] = useState(2);

  useEffect(() => {
    if (!context.current) {
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        rootContainer: vtkContainerRef.current,
      });
      const sphereSource = vtkSphereSource.newInstance({ radius: 1.0, thetaResolution: sphereResolution, phiResolution: sphereResolution }); // Используем vtkSphereSource

      const mapper = vtkMapper.newInstance();
      mapper.setInputConnection(sphereSource.getOutputPort());

      const actor = vtkActor.newInstance();
      actor.setMapper(mapper);

      const renderer = fullScreenRenderer.getRenderer();
      const renderWindow = fullScreenRenderer.getRenderWindow();

      renderer.addActor(actor);
      renderer.resetCamera();
      renderWindow.render();

      context.current = {
        fullScreenRenderer,
        renderWindow,
        renderer,
        sphereSource,  // Обновлено на sphereSource
        actor,
        mapper,
      };
    }

    return () => {
      if (context.current) {
        const { fullScreenRenderer, sphereSource, actor, mapper } = context.current;
        actor.delete();
        mapper.delete();
        sphereSource.delete();
        fullScreenRenderer.delete();
        context.current = null;
      }
    };
  }, [sphereResolution, vtkContainerRef]);

  useEffect(() => {
    if (context.current) {
      const { sphereSource, renderWindow } = context.current;
      sphereSource.setThetaResolution(sphereResolution); // Обновлено на thetaResolution
      sphereSource.setPhiResolution(sphereResolution);   // Обновлено на phiResolution
      renderWindow.render();
    }
  }, [sphereResolution]);

  useEffect(() => {
    if (context.current) {
      const { actor, renderWindow } = context.current;
      actor.getProperty().setRepresentation(representation);
      renderWindow.render();
    }
  }, [representation]);

  return (
    <div>
      <div ref={vtkContainerRef} />
      <table
        style={{
          position: 'absolute',
          top: '25px',
          left: '25px',
          background: 'white',
          padding: '12px',
        }}
      >
        <tbody>
          <tr>
            <td>
              <select
                value={representation}
                style={{ width: '100%' }}
                onInput={(ev) => setRepresentation(Number(ev.target.value))}
              >
                <option value="0">Points</option>
                <option value="1">Wireframe</option>
                <option value="2">Surface</option>
              </select>
            </td>
          </tr>
          <tr>
            <td>
              <input
                type="range"
                min="8"
                max="80"
                value={sphereResolution}
                onChange={(ev) => setSphereResolution(Number(ev.target.value))}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default App;
import { useState, useRef, useEffect } from 'react';

import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkLineSource from '@kitware/vtk.js/Filters/Sources/LineSource';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';

let createLine = (x1, y1, z1, x2, y2, z2) => {
  return vtkLineSource.newInstance({
    point1: [x1, y1, z1],
    point2: [x2, y2, z2],
  });
};

function App() {
  const vtkContainerRef = useRef(null);
  const context = useRef(null);
  const [sphereResolution, setSphereResolution] = useState(16); // Изменим разрешение для большего числа сегментов
  const [representation, setRepresentation] = useState(2); // Surface, wireframe, points

  useEffect(() => {
    if (!context.current) {
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        rootContainer: vtkContainerRef.current,
      });

      // Создание сферы
      const sphereSource = vtkSphereSource.newInstance({
        radius: 1.0,
        thetaResolution: sphereResolution,  // Широта
        phiResolution: sphereResolution,    // Долгота
      });

      // Получение полигональных данных (точек) из сферы
      const polydata = sphereSource.getOutputData();

      // Создание массива цветов для каждого сегмента
      const colors = new Uint8Array(polydata.getPoints().getNumberOfPoints() * 3);
      
      // Определение цветовых областей по phi и theta сегментам
      const numSegmentsTheta = sphereResolution; // Количество сегментов вдоль широты
      const numSegmentsPhi = sphereResolution;   // Количество сегментов вдоль долготы
      
      // Проходим по точкам и задаём цвет для каждой из них
      for (let i = 0; i < polydata.getPoints().getNumberOfPoints(); i++) {
        const thetaIndex = Math.floor((i % numSegmentsTheta) / (numSegmentsTheta / 4)); // Сегментация по широте
        const phiIndex = Math.floor(i / numSegmentsTheta); // Сегментация по долготе

        // Устанавливаем цвет для сегмента
        const red = (thetaIndex % 2) * 255;  // Красные полосы для четных индексов
        const green = (phiIndex % 2) * 255;  // Зелёные полосы для нечётных индексов
        const blue = 255 - red - green;      // Смешиваем синие оттенки

        colors[i * 3] = red;
        colors[i * 3 + 1] = green;
        colors[i * 3 + 2] = blue;
      }

      // Присваиваем массив цветов к данным сферы
      const colorArray = vtkDataArray.newInstance({
        numberOfComponents: 3, // RGB
        values: colors,
        name: 'Colors',
      });

      // Добавляем цвета в полигональные данные
      polydata.getPointData().setScalars(colorArray);

      // Создание маппера и привязка к полигональным данным сферы
      const sphereMapper = vtkMapper.newInstance();
      sphereMapper.setInputData(polydata);

      const sphereActor = vtkActor.newInstance();
      sphereActor.setMapper(sphereMapper);

      // Создание линии (трейсера)
      const lineSource = vtkLineSource.newInstance({
        point1: [1, 0, 0],  // Начальная точка линии
        point2: [2, 0, 0],  // Конечная точка линии
      });
      const secondLineSource = createLine(-1, 0, 0, -2, 0, 0);
      
      const lineMapper = vtkMapper.newInstance();
      lineMapper.setInputConnection(lineSource.getOutputPort());

      const secondLineMapper = vtkMapper.newInstance();
      secondLineMapper.setInputConnection(secondLineSource.getOutputPort());

      const lineActor = vtkActor.newInstance();
      lineActor.setMapper(lineMapper);

      const secondLineActor = vtkActor.newInstance();
      secondLineActor.setMapper(secondLineMapper);

      // Добавление актёров (сфера и линии) в рендерер
      const renderer = fullScreenRenderer.getRenderer();
      const renderWindow = fullScreenRenderer.getRenderWindow();

      renderer.addActor(sphereActor);  // Добавляем сферу
      renderer.addActor(lineActor);    // Добавляем первую линию
      renderer.addActor(secondLineActor); // Добавляем вторую линию
      renderer.resetCamera();
      renderWindow.render();

      context.current = {
        fullScreenRenderer,
        renderWindow,
        renderer,
        sphereSource,
        sphereActor,
        lineSource,      // Линия
        lineActor,       // Актёр линии
        secondLineSource,
        secondLineActor,
        sphereMapper,
        lineMapper,
        secondLineMapper,
      };
    }

    return () => {
      if (context.current) {
        const { fullScreenRenderer, sphereSource, sphereActor, lineSource, lineActor, secondLineSource, secondLineActor, sphereMapper, lineMapper, secondLineMapper } = context.current;
        sphereActor.delete();
        sphereMapper.delete();
        sphereSource.delete();
        lineActor.delete();   // Удаляем актёра линии
        lineMapper.delete();  // Удаляем маппер линии
        lineSource.delete();  // Удаляем источник линии
        secondLineActor.delete();
        secondLineMapper.delete();
        secondLineSource.delete();
        fullScreenRenderer.delete();
        context.current = null;
      }
    };
  }, [sphereResolution, vtkContainerRef]);

  useEffect(() => {
    if (context.current) {
      const { sphereSource, renderWindow } = context.current;
      sphereSource.setThetaResolution(sphereResolution);
      sphereSource.setPhiResolution(sphereResolution);
      renderWindow.render();
    }
  }, [sphereResolution]);

  useEffect(() => {
    if (context.current) {
      const { sphereActor, renderWindow } = context.current;
      sphereActor.getProperty().setRepresentation(representation);
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

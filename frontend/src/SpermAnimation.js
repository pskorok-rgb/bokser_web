// frontend/src/SpermAnimation.js

import React, { useRef, useEffect } from 'react';
import paper from 'paper';

const SpermAnimation = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    paper.setup(canvas);

    // Kod, który podałeś, zintegrowany z React
    const { Key, view, Path, Point, Symbol, PlacedSymbol, Tool } = paper;

    const sperm = new function() {
        const center = view.center;
        const size = 20;
        const partLength = 5;
        const path = new Path();
        for (let i = 0; i < size; i++) {
            path.add(center.subtract([i * partLength, 0]));
        }
        path.strokeColor = 'white';
        path.strokeWidth = 4;
        path.strokeCap = 'round';

        const headPath = new Path.Oval({
            from: [0, 0],
            to: [13, 8],
            fillColor: 'white',
            strokeColor: null
        });
        headPath.scale(1.3);
        const headSymbol = new Symbol(headPath);
        const head = new PlacedSymbol(headSymbol);
        let vector = new Point({ angle: 0, length: 20 });
        let speed = 1;
        const maxSteer = 4.5;
        const friction = 0.98;
        const steering = 1.5;
        const maxSpeed = 10;
        const minSpeed = 1;
        let position = center;
        let lastRotation = 0;
        let count = 0;

        return {
            left: function() {
                if (speed >= 0.01) {
                    if (speed < 3 && speed >= 0) vector.angle -= (speed * 2);
                    else if (speed < 0) vector.angle -= (speed / 2);
                    else vector.angle -= maxSteer * steering;
                    speed *= friction;
                }
            },
            right: function() {
                if (speed >= 0.01) {
                    if (speed < 3 && speed >= 0) vector.angle += (speed * 2);
                    else if (speed < 0) vector.angle += (speed / 2);
                    else vector.angle += maxSteer * steering;
                    speed *= friction;
                }
            },
            forward: function() {
                speed += 0.3;
                speed = Math.min(maxSpeed, speed);
            },
            reverse: function() {
                speed -= 0.3;
                if (speed < minSpeed) speed = minSpeed;
            },
            draw: function() {
                const vec = vector.normalize(Math.abs(speed));
                speed = speed * friction;
                position = position.add(vec);
                let lastPoint = path.firstSegment.point = position;
                let lastVector = vec;
                const segments = path.segments;
                for (let i = 1, l = segments.length; i < l; i++) {
                    const segment = segments[i];
                    const vector2 = lastPoint.subtract(segment.point);
                    count += vec.length * 10;
                    const rotLength = Math.sin((count + i * 3) / 600);
                    const rotated = lastVector.rotate(90).normalize(rotLength);
                    lastPoint = segment.point = lastPoint.add(lastVector.normalize(-partLength - vec.length / 10));
                    segment.point = segment.point.add(rotated);
                    if (i === 1) {
                        head.position = position;
                        const rotation = vector2.angle;
                        head.rotate(rotation - lastRotation);
                        lastRotation = rotation;
                    }
                    lastVector = vector2;
                }
                path.smooth();
                this.constrain();
            },
            constrain: function() {
                const bounds = path.bounds;
                const size = view.size;
                if (!bounds.intersects(view.bounds)) {
                    if (position.x < -bounds.width) position.x = size.width + bounds.width;
                    if (position.y < -bounds.height) position.y = size.height + bounds.height;
                    if (position.x > size.width + bounds.width) position.x = -bounds.width;
                    if (position.y > size.height + bounds.height) position.y = -bounds.height;
                    path.position = position;
                }
            }
        };
    };

    view.onFrame = () => {
        if (Key.isDown('left')) sperm.left();
        if (Key.isDown('right')) sperm.right();
        if (Key.isDown('up')) sperm.forward();
        if (Key.isDown('down')) sperm.reverse();
        sperm.draw();
    };
    
    // Używamy dedykowanego narzędzia dla zdarzeń klawiatury
    const tool = new Tool();
    tool.onKeyDown = (event) => {
        // Zapobiega przewijaniu strony strzałkami
        if (['left', 'right', 'up', 'down'].includes(event.key)) {
            event.preventDefault();
        }
    };
    tool.activate();

    return () => {
      paper.project.clear();
    };
  }, []);

  return <canvas ref={canvasRef} id="spermCanvas" />;
};

export default SpermAnimation;
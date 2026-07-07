// src/ui/PhysicsHUD.js

export default class PhysicsHUD {
    constructor(containerId = 'physics-hud') {
        this.container = document.getElementById(containerId) || this.createContainer(containerId);
        this.elements = {};
        this.physics = null;
        this.ballVisual = null;
        this.rollingFriction = null;
        this.isMinimized = false;
        this.contentWrapper = null;
        this.init();
    }

    createContainer(id) {
        const container = document.createElement('div');
        container.id = id;
        container.style.cssText = `
            position: absolute;
            top: 60px;
            left: 10px;
            background: rgba(0, 0, 0, 0.85);
            color: #00ffaa;
            font-family: 'Segoe UI', 'Arial', sans-serif;
            font-weight: 500;
            font-size: 13px;
            border-radius: 12px;
            border: 1px solid rgba(0, 255, 170, 0.3);
            min-width: 300px;
            max-height: 90vh;
            overflow: hidden;
            pointer-events: none;
            z-index: 100;
            backdrop-filter: blur(10px);
            box-shadow: 0 0 30px rgba(0, 255, 170, 0.1);
        `;
        document.body.appendChild(container);
        return container;
    }

    init() {
        // إضافة رأس مع زر التصغير
        this.createHeader();
        
        // إنشاء حاوية للمحتوى
        this.contentWrapper = document.createElement('div');
        this.contentWrapper.style.cssText = `
            padding: 0 20px 20px 20px;
            transition: all 0.3s ease;
            overflow: hidden;
        `;
        this.container.appendChild(this.contentWrapper);

        // إنشاء الأقسام داخل contentWrapper
        this.createSection('flight-data', 'Simulation Data');
        this.createSection('energy-data', 'Energy Level');
        this.createSection('ball-properties', 'Ball Properties');
        // this.createSection('table-properties', 'Table Properties');  // ← تم حذفه
    }

    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            cursor: pointer;
            pointer-events: auto;
            border-bottom: 1px solid rgba(0, 255, 170, 0.15);
            user-select: none;
        `;

        const title = document.createElement('span');
        title.textContent = '📊 Physics Data';
        title.style.cssText = `
            font-weight: bold;
            font-size: 14px;
            color: #00ffaa;
            letter-spacing: 0.5px;
        `;

        const minimizeBtn = document.createElement('button');
        minimizeBtn.textContent = '−';
        minimizeBtn.style.cssText = `
            background: none;
            border: 1px solid rgba(0, 255, 170, 0.3);
            color: #00ffaa;
            border-radius: 4px;
            cursor: pointer;
            font-size: 18px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            pointer-events: auto;
            background: rgba(0, 255, 170, 0.05);
        `;

        minimizeBtn.onmouseenter = () => {
            minimizeBtn.style.background = 'rgba(0, 255, 170, 0.15)';
            minimizeBtn.style.borderColor = 'rgba(0, 255, 170, 0.6)';
        };

        minimizeBtn.onmouseleave = () => {
            minimizeBtn.style.background = 'rgba(0, 255, 170, 0.05)';
            minimizeBtn.style.borderColor = 'rgba(0, 255, 170, 0.3)';
        };

        minimizeBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleMinimize();
        };

        // النقر على الرأس أيضاً لتصغير/تكبير
        header.onclick = () => {
            this.toggleMinimize();
        };

        header.appendChild(title);
        header.appendChild(minimizeBtn);
        this.container.appendChild(header);
        
        // حفظ الزر للاستخدام لاحقاً
        this.minimizeBtn = minimizeBtn;
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        
        if (this.isMinimized) {
            this.contentWrapper.style.maxHeight = '0';
            this.contentWrapper.style.padding = '0 20px';
            this.contentWrapper.style.opacity = '0';
            this.minimizeBtn.textContent = '+';
            this.container.style.minWidth = 'auto';
        } else {
            this.contentWrapper.style.maxHeight = '2000px';
            this.contentWrapper.style.padding = '0 20px 20px 20px';
            this.contentWrapper.style.opacity = '1';
            this.minimizeBtn.textContent = '−';
            this.container.style.minWidth = '300px';
        }
    }

    createSection(sectionId, title) {
        const section = document.createElement('div');
        section.id = sectionId;
        section.style.cssText = `
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(0, 255, 170, 0.15);
        `;

        const titleEl = document.createElement('div');
        titleEl.textContent = title;
        titleEl.style.cssText = `
            font-weight: bold;
            font-size: 14px;
            color: #00ffaa;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        section.appendChild(titleEl);

        this.contentWrapper.appendChild(section);
        this.elements[sectionId] = section;
    }

    addField(sectionId, label, getValue, format = (v) => v.toFixed(2)) {
        const section = this.elements[sectionId];
        if (!section) return;

        const field = document.createElement('div');
        field.style.cssText = `
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            font-size: 12px;
        `;

        const labelEl = document.createElement('span');
        labelEl.textContent = label + ':';
        labelEl.style.color = '#88ccff';

        const valueEl = document.createElement('span');
        valueEl.textContent = '0.00';
        valueEl.style.color = '#ffffff';
        valueEl.style.fontWeight = 'bold';

        field.appendChild(labelEl);
        field.appendChild(valueEl);
        section.appendChild(field);

        this.elements[`${sectionId}-${label}`] = {
            update: () => {
                const val = getValue();
                valueEl.textContent = format(val);
            },
            element: field
        };

        return field;
    }

    addVectorField(sectionId, label, getVector, format = (v) => v.toFixed(3)) {
        const section = this.elements[sectionId];
        if (!section) return;

        const container = document.createElement('div');
        container.style.cssText = `
            margin: 4px 0;
        `;

        const labelEl = document.createElement('div');
        labelEl.textContent = label;
        labelEl.style.cssText = `
            color: #88ccff;
            font-size: 11px;
            margin-bottom: 2px;
        `;
        container.appendChild(labelEl);

        const values = document.createElement('div');
        values.style.cssText = `
            display: flex;
            gap: 12px;
            font-size: 12px;
            padding-left: 8px;
        `;

        const xEl = document.createElement('span');
        xEl.style.color = '#ff6b6b';
        const yEl = document.createElement('span');
        yEl.style.color = '#4ecdc4';
        const zEl = document.createElement('span');
        zEl.style.color = '#45b7d1';

        values.appendChild(xEl);
        values.appendChild(yEl);
        values.appendChild(zEl);
        container.appendChild(values);
        section.appendChild(container);

        this.elements[`${sectionId}-${label}-vec`] = {
            update: () => {
                const vec = getVector();
                xEl.textContent = `X: ${format(vec.x)}`;
                yEl.textContent = `Y: ${format(vec.y)}`;
                zEl.textContent = `Z: ${format(vec.z)}`;
            }
        };

        return container;
    }

    setPhysicsReferences(physics, ballVisual, rollingFriction) {
        this.physics = physics;
        this.ballVisual = ballVisual;
        this.rollingFriction = rollingFriction;
        this.setupFields();
    }

    setupFields() {
        if (!this.physics) return;
        const cueBall = this.physics.balls[0];
        if (!cueBall) return;

        // === Flight Data ===
        this.addField('flight-data', 'Ball Height', () => 0.00, (v) => v.toFixed(2) + ' m');
        this.addField('flight-data', 'Time', () => this.physics.time, (v) => v.toFixed(2) + ' s');

        this.addVectorField('flight-data', 'Position', () => cueBall.position);
        this.addVectorField('flight-data', 'Velocity', () => cueBall.velocity);
        this.addVectorField('flight-data', 'Acceleration', () => cueBall.acceleration);

        this.addField('flight-data', 'Total Force', () => {
            const total = this.physics.getTotalForce(cueBall);
            return total.length();
        }, (v) => v.toFixed(2) + ' N');

        this.addField('flight-data', 'Friction Force', () => {
            return this.rollingFriction?.force?.length() || 0;
        }, (v) => v.toFixed(2) + ' N');

        this.addField('flight-data', 'Normal Force', () => {
            return cueBall.mass * 9.81;
        }, (v) => v.toFixed(2) + ' N');

        this.addField('flight-data', 'Gravity Force', () => {
            return cueBall.mass * 9.81;
        }, (v) => v.toFixed(2) + ' N');

        // === Energy Data ===
        this.addField('energy-data', 'Kinetic Energy', () => {
            return 0.5 * cueBall.mass * cueBall.velocity.lengthSq();
        }, (v) => v.toFixed(2) + ' J');

        this.addField('energy-data', 'Rotational Energy', () => {
            return 0.5 * cueBall.momentOfInertia * cueBall.angularVelocity.lengthSq();
        }, (v) => v.toFixed(2) + ' J');

        this.addField('energy-data', 'Total Energy', () => {
            const ke = 0.5 * cueBall.mass * cueBall.velocity.lengthSq();
            const re = 0.5 * cueBall.momentOfInertia * cueBall.angularVelocity.lengthSq();
            return ke + re;
        }, (v) => v.toFixed(2) + ' J');

        // === Ball Properties ===
        this.addField('ball-properties', 'Surface Type', () => 'Phenolic Resin', (v) => v);
        this.addField('ball-properties', 'Initial Mass', () => cueBall.mass, (v) => v.toFixed(4) + ' kg');
        this.addField('ball-properties', 'Current Mass', () => cueBall.mass, (v) => v.toFixed(4) + ' kg');
        this.addField('ball-properties', 'Radius', () => cueBall.radius, (v) => v.toFixed(4) + ' m');
        this.addField('ball-properties', 'Density', () => cueBall.density, (v) => v.toFixed(0) + ' kg/m³');
        this.addField('ball-properties', 'Friction', () => cueBall.friction, (v) => v.toFixed(3));
        this.addField('ball-properties', 'Restitution', () => cueBall.restitution, (v) => v.toFixed(3));

        // === Table Properties === تم حذفه بالكامل
        // this.addField('table-properties', 'Floor Friction', () => this.rollingFriction?.floorFriction || 0, (v) => v.toFixed(3));
        // this.addField('table-properties', 'Wall Restitution', () => this.physics.restitution, (v) => v.toFixed(3));
        // this.addField('table-properties', 'Wall Friction', () => this.physics.wallFriction, (v) => v.toFixed(3));
    }

    update() {
        for (const key in this.elements) {
            if (this.elements[key]?.update) {
                this.elements[key].update();
            }
        }
    }

    toggleVisibility() {
        this.container.style.display = this.container.style.display === 'none' ? '' : 'none';
    }
}
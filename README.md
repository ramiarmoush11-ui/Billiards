# Billiards Physics Simulation

A physics-based billiards simulation focused on modeling realistic ball movement and interactions using mathematical and physical principles.

The project combines linear and rotational motion with friction, spin, collisions, momentum transfer, and wall rebounds to create a stable and realistic billiards simulation.

## Features

- Realistic linear motion of billiard balls
- Rotational motion and angular velocity
- Rolling friction and velocity dissipation
- Forward, backward, and side spin
- Spin dissipation over time
- Ball-to-ball collision detection and resolution
- Momentum transfer during collisions
- Elastic and near-elastic collision behavior
- Wall and cushion rebounds
- Tangential friction during collisions
- Rotational effects during wall and ball collisions
- Stability handling at very low velocities
- Hard-stop mechanism to prevent numerical vibration
- Dynamic physical properties based on ball radius and density

## Physics Model

The simulation models several aspects of classical mechanics, including:

- Newton's Second Law
- Linear momentum and conservation of momentum
- Angular momentum and angular impulse
- Torque
- Moment of inertia
- Rolling friction
- Static and kinetic friction
- Coefficient of restitution
- Linear and rotational kinetic energy
- Collision normals and vector decomposition

The simulation also models the relationship between linear and angular motion to achieve pure rolling behavior.

## Numerical Integration

The physics engine uses the **Semi-Implicit Euler** integration method to update the linear and rotational state of the balls at each time step.

This approach was selected because of its computational efficiency and suitability for real-time physics simulations involving discontinuous collision impulses.

## Collision System

Collisions are detected geometrically by comparing the distance between ball centers with the sum of their radii.

The collision resolution system handles:

- Collision normals
- Linear momentum transfer
- Restitution
- Tangential friction
- Spin transfer
- Angular velocity updates
- Penetration correction

The simulation also handles collisions between balls and the table boundaries.

## Project Goals

The main goal of the project is to build a physics-based environment that reproduces important physical behaviors of billiard balls rather than treating them as simple objects moving in straight lines.

The model considers both translational and rotational motion and their interaction with friction, collisions, and the table surface.

## Technologies

- JavaScript
- Three.js
- Physics Simulation
- Vector Mathematics

## Academic Project

Developed as a university project focused on the physical and mathematical modeling of billiard ball motion.

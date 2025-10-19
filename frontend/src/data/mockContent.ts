// Mock extracted content for sample uploads
export const mockExtractedContent: Record<string, string> = {
  "upload-1": `# Calculus Lecture 5: Derivatives and Applications

## Key Concepts

The derivative of a function represents the instantaneous rate of change. For a function f(x), the derivative f'(x) is defined as:

f'(x) = lim(h→0) [f(x+h) - f(x)] / h

### Common Derivatives
- Power Rule: d/dx(x^n) = nx^(n-1)
- Product Rule: d/dx[f(x)g(x)] = f'(x)g(x) + f(x)g'(x)
- Chain Rule: d/dx[f(g(x))] = f'(g(x)) · g'(x)

### Applications
1. Finding maximum and minimum values
2. Optimization problems
3. Related rates
4. Motion and velocity calculations

## Example Problems

Problem 1: Find the derivative of f(x) = 3x^2 + 5x - 7
Solution: f'(x) = 6x + 5

Problem 2: A particle moves along a line with position s(t) = t^3 - 6t^2 + 9t. Find when the velocity is zero.
Solution: v(t) = s'(t) = 3t^2 - 12t + 9 = 0, solving gives t = 1 or t = 3`,

  "upload-2": `# Chemistry Chapter 3: Chemical Bonding

## Introduction to Chemical Bonds

Chemical bonds are forces that hold atoms together in molecules and compounds. There are three main types:

### 1. Ionic Bonds
- Form between metals and nonmetals
- Electrons are transferred from one atom to another
- Result in charged ions (cations and anions)
- Example: NaCl (sodium chloride)

### 2. Covalent Bonds
- Form between nonmetals
- Electrons are shared between atoms
- Can be single, double, or triple bonds
- Example: H2O (water), CO2 (carbon dioxide)

### 3. Metallic Bonds
- Form between metal atoms
- Electrons are delocalized in a "sea of electrons"
- Give metals their characteristic properties

## Electronegativity and Bond Polarity

Electronegativity is the ability of an atom to attract electrons in a bond. Differences in electronegativity determine bond type:
- Difference > 1.7: Ionic bond
- Difference 0.4-1.7: Polar covalent bond
- Difference < 0.4: Nonpolar covalent bond

## Lewis Structures
Rules for drawing Lewis structures:
1. Count total valence electrons
2. Draw skeletal structure
3. Complete octets (except H which needs 2)
4. Place remaining electrons on central atom
5. Form multiple bonds if needed`,

  "upload-3": `# Physics Lecture - October 15: Kinematics

## Motion in One Dimension

### Key Equations
- Velocity: v = Δx/Δt
- Acceleration: a = Δv/Δt
- Position with constant acceleration: x = x₀ + v₀t + ½at²
- Velocity with constant acceleration: v = v₀ + at
- Velocity squared: v² = v₀² + 2a(x - x₀)

### Free Fall
Objects in free fall experience constant acceleration due to gravity:
- g = 9.8 m/s² (downward)
- Initial velocity determines trajectory
- Air resistance is negligible for dense objects

## Vector Components
For motion at an angle θ:
- Horizontal component: vₓ = v cos(θ)
- Vertical component: vᵧ = v sin(θ)
- Magnitude: v = √(vₓ² + vᵧ²)

## Projectile Motion
- Horizontal motion: constant velocity (no acceleration)
- Vertical motion: constant acceleration (-g)
- Maximum height occurs when vᵧ = 0
- Range depends on initial velocity and angle

### Example Problem
A ball is thrown horizontally from a 20m tall building at 15 m/s. When does it hit the ground?

Using y = y₀ + v₀t + ½at²:
0 = 20 + 0 - ½(9.8)t²
t = √(40/9.8) ≈ 2.02 seconds`,

  "upload-4": `# Study Group Discussion - Organic Chemistry

[Transcribed from audio recording]

**Sarah:** Okay, so let's review the main points from Chapter 5 on stereochemistry.

**Mike:** Right, so stereoisomers are molecules with the same molecular formula and connectivity but different spatial arrangements.

**Sarah:** Exactly. And there are two main types - enantiomers and diastereomers.

**Mike:** Enantiomers are like mirror images that aren't superimposable, right? Like your left and right hands.

**Sarah:** Perfect analogy! They have opposite configurations at all chiral centers. And they rotate plane-polarized light in opposite directions.

**Mike:** What about diastereomers?

**Sarah:** Those are stereoisomers that aren't mirror images. They have different physical and chemical properties, unlike enantiomers which have identical properties except for optical rotation.

**Mike:** Can you give an example?

**Sarah:** Sure! Think about 2,3-dibromobutane. It has two chiral centers, so it can have multiple stereoisomers. The (R,R) and (S,S) forms are enantiomers of each other, and the (R,S) form is a diastereomer to both.

**Mike:** That makes sense. What about the meso compounds?

**Sarah:** Good question! A meso compound has chiral centers but an internal plane of symmetry, so it's achiral overall. It's its own mirror image.

**Mike:** Oh, like tartaric acid?

**Sarah:** Exactly! You're getting it. Should we move on to naming conventions?`,

  "upload-5": `# Quadratic Formula

The quadratic formula is used to solve equations of the form:

ax² + bx + c = 0

where a ≠ 0.

## The Formula

x = [-b ± √(b² - 4ac)] / (2a)

## Discriminant

The discriminant Δ = b² - 4ac determines the nature of the roots:

- If Δ > 0: Two distinct real roots
- If Δ = 0: One repeated real root (or two identical roots)
- If Δ < 0: Two complex conjugate roots

## Example

Solve: 2x² - 5x + 2 = 0

Here, a = 2, b = -5, c = 2

Δ = (-5)² - 4(2)(2) = 25 - 16 = 9

x = [5 ± √9] / (2·2) = [5 ± 3] / 4

Therefore:
x₁ = (5 + 3)/4 = 2
x₂ = (5 - 3)/4 = 0.5

The solutions are x = 2 and x = 0.5`,

  "upload-6": `# Integration Problems - Practice Set

## Fundamental Theorem of Calculus

∫[a,b] f(x)dx = F(b) - F(a)

where F'(x) = f(x)

## Basic Integration Rules

1. Power Rule: ∫x^n dx = (x^(n+1))/(n+1) + C, for n ≠ -1

2. Constant Multiple: ∫kf(x)dx = k∫f(x)dx

3. Sum Rule: ∫[f(x) + g(x)]dx = ∫f(x)dx + ∫g(x)dx

4. Exponential: ∫e^x dx = e^x + C

5. Natural Log: ∫(1/x)dx = ln|x| + C

## Practice Problems

### Problem 1
Evaluate: ∫(3x² + 2x - 5)dx

Solution:
= x³ + x² - 5x + C

### Problem 2
Evaluate: ∫[0,2] (x² + 1)dx

Solution:
F(x) = (x³/3) + x
F(2) - F(0) = (8/3 + 2) - (0) = 14/3

### Problem 3
Find the area under y = x² from x = 0 to x = 3

Solution:
Area = ∫[0,3] x²dx = [x³/3]₀³ = 27/3 - 0 = 9 square units

### Problem 4 (Integration by Substitution)
Evaluate: ∫2x(x² + 1)⁵dx

Let u = x² + 1, then du = 2x dx

∫u⁵du = (u⁶/6) + C = [(x² + 1)⁶]/6 + C`
};

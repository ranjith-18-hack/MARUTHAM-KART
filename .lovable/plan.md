# Plan - Marutham Kart Visual Branding & Illustration Upgrade

Upgrade the visual design of all portals with a consistent, premium Indian illustration style while maintaining operational efficiency and information architecture.

## User Review Required

> [!IMPORTANT]
> This upgrade uses SVG-based illustrations to ensure a consistent, modern, and professional look across all portals without relying on external image assets that might break the brand language.

- Do you have any specific regional Indian cultural elements you'd like highlighted in the illustrations (e.g., specific crops or architectural styles)?
- Should the "Seed-to-Brand" opening animation be further integrated with the new illustration style?

## Proposed Changes

### Visual Foundation & Illustrations
- Create a centralized `Illustration` component library in `src/components/illustrations/` containing custom SVG illustrations for:
    - **Agriculture**: Farmers, fields, fresh produce (vegetables, rice, wheat).
    - **Logistics**: Godown workers, delivery drivers, transport vehicles.
    - **Corporate**: HR/Recruitment, Office Managers, Business Owners.
    - **Empty States**: Contextual small illustrations for "No Data" scenarios.
- Apply a consistent color palette using `@theme` variables: Primary Green (#16803A), Dark Green, Natural Neutrals.

### Customer Portal Upgrade
- **Login Page**: Implement split layout.
    - Left: Large agricultural scene illustration (Farmer in field, delivery ecosystem).
    - Right: Clean login card with logo and professional typography.
- **Dashboard**: 
    - New Hero section: "Fresh from Our Farmers, Straight to Your Home."
    - Category cards with integrated small illustrations/icons.
- **Product Experience**: Refine `ProductCard` with natural imagery and clear farmer source indicators.

### Operations Portals (Godown, Transport, Driver)
- **Godown**: Add warehouse/inventory illustration to the dashboard hero.
- **Transport**: Logistics-focused illustration for the command center.
- **Driver**: Mobile-first dashboard with a friendly driver/vehicle illustration.
- **Recruitment**: "Building the Team" illustration showcasing the diverse workforce.
- **Head Office/Regional**: Ecosystem-wide illustrations showing centralized/regional control.

### UI/UX Refinement
- **Empty States**: Replace text-only messages with contextual illustrations and helpful copy.
- **Animations**: Add subtle Framer Motion transitions (fade-ins, gentle illustration floats).
- **Global Consistency**: Audit and unify spacing, typography, and component styling across all namespaces.

## Technical Details
- **SVGs**: Use inline SVGs or React components for illustrations to ensure sharp rendering and easy color theme injection.
- **Layouts**: Use CSS Grid and Flexbox for the new login split-view and responsive hero sections.
- **Framer Motion**: Standardize animation constants (durations, easing) for brand consistency.
- **TanStack Router**: Maintain all existing route logic; modifications will be strictly presentation-layer.

## MODIFIED Requirements

### Requirement: Multi-layer historical map overlay
The system SHALL overlay modern satellite imagery and Stein's Serindia historical map tiles in XYZ format, and SHALL provide an opacity slider for historical-to-modern map comparison.

#### Scenario: Historical layer rendering and opacity control
- **WHEN** user adjusts the historical map opacity slider
- **THEN** the historical map layer transparency SHALL update dynamically on top of the base satellite layer

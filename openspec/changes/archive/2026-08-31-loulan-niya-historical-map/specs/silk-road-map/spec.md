## ADDED Requirements

### Requirement: Multi-layer historical map overlay
The system SHALL overlay modern satellite imagery and Stein's Serindia historical map tiles in XYZ format.

#### Scenario: Historical layer rendering and opacity control
- **WHEN** user adjusts the historical map opacity slider
- **THEN** the historical map layer transparency SHALL update dynamically on top of the base satellite layer

### Requirement: Archaeological site points visualization
The system SHALL render archaeological sites from a local GeoJSON dataset with evidence level distinctions.

#### Scenario: Site marker display
- **WHEN** the map loads `data/sites.geojson`
- **THEN** site markers SHALL be plotted at their specified geographic coordinates with evidence level indicators

### Requirement: Timeline filtering
The system SHALL filter visible archaeological sites based on a user-selected historical year.

#### Scenario: Year slider interaction
- **WHEN** user changes the timeline slider position
- **THEN** only sites whose active period covers the selected year SHALL remain visible on the map

### Requirement: Site detail side panel
The system SHALL provide a side panel showing detailed archaeological metadata and imagery upon selecting a site.

#### Scenario: Marker selection
- **WHEN** user clicks on a site marker
- **THEN** the side panel SHALL display the site Chinese name, Kharosthi transcription, Stein ID, period, evidence level, rights status, description, and source links

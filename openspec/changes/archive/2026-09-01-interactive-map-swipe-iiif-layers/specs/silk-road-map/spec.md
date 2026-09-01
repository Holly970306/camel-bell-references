## ADDED Requirements

### Requirement: Swipe comparison mode
The system SHALL support a side-by-side swipe comparison mode between Stein's Serindia historical map and modern satellite imagery.

#### Scenario: Switching to swipe comparison
- **WHEN** user selects swipe comparison mode
- **THEN** a draggable vertical divider SHALL appear on the map, displaying the historical map on the left and satellite imagery on the right

##### Example: Swipe divider positioning
- **GIVEN** map is in swipe comparison mode
- **WHEN** user drags the divider to 50% width
- **THEN** the left 50% shows historical map and right 50% shows modern satellite

### Requirement: IIIF deep zoom viewer in detail panel
The system SHALL provide an interactive deep zoom viewer using OpenSeadragon for artifacts containing a valid IIIF URL.

#### Scenario: Displaying artifact with IIIF source
- **WHEN** user selects a site whose artifact image includes a `iiif_url`
- **THEN** the side panel SHALL initialize an OpenSeadragon viewer allowing deep zooming into artifact details

##### Example: Kharosthi tablet zoom
- **GIVEN** Niya artifact with IIIF image endpoint
- **WHEN** user zooms into the image
- **THEN** high-resolution tile fragments SHALL load dynamically to reveal stroke details

### Requirement: Independent vector layers for waterways and routes
The system SHALL load and display historical waterways and Silk Road routes from distinct GeoJSON datasets with dedicated toggle controls.

#### Scenario: Toggling historical waterways and routes
- **WHEN** user toggles the "古水系故道" or "商路推測線" layer switches
- **THEN** the corresponding vector polylines SHALL show or hide accordingly

##### Example: Waterway active period filtering
- **GIVEN** Peacock River ancient branch active from -200 to 400
- **WHEN** timeline is set to year 600
- **THEN** the dried-up branch SHALL be hidden or styled as abandoned

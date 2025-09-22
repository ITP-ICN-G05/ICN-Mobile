# ICN Navigator Company Data Structure Documentation

## File Overview

- **File Name**: `ICN_Navigator.Company.json`
- **File Type**: JSON Array
- **Number of Records**: Approximately 221,118 lines
- **Purpose**: Store company and organization data for the ICN Navigator system

## Data Structure Description

### Root Structure

The data file is a JSON array containing multiple company item objects.

### Main Object Structure

#### Item Object

Each main object represents a specific industrial project or service category.

```json
{
  "_id": {
    "$oid": "Unique MongoDB ObjectID"
  },
  "Detailed Item ID": "Detailed item ID (e.g., DITM-000530)",
  "Item Name": "Item name",
  "Item ID": "Item ID (e.g., ITM-002348)",
  "Detailed Item Name": "Detailed item name",
  "Sector Mapping ID": "Sector mapping ID (e.g., SM-000524)",
  "Sector Name": "Sector name",
  "Subtotal": "Number of organizations",
  "Organizations": [Organization array]
}
```

#### Organization Object

Each item contains information about one or more related organizations.

```json
{
  "Organisation Capability": "Organization capability ID (e.g., OC-018235)",
  "Organisation: Organisation Name": "Organization name",
  "Organisation: Organisation ID": "Organization ID",
  "Capability Type": "Capability type (Supplier/Manufacturer)",
  "Validation Date": "Validation date (e.g., 1/07/2025)",
  "Organisation: Billing Street": "Billing street address",
  "Organisation: Billing City": "Billing city",
  "Organisation: Billing State/Province": "Billing state/province",
  "Organisation: Billing Zip/Postal Code": "Billing postal code"
}
```

## Data Field Details

### Core Identifier Fields

| Field Name | Data Type | Description | Example |
|---------|---------|------|-----|
| `_id` | Object | MongoDB unique identifier | `{"$oid": "68c4d6b4650396bdb02dc217"}` |
| `Detailed Item ID` | String | Detailed item unique identifier | `"DITM-000530"` |
| `Item ID` | String | Item identifier | `"ITM-002348"` |
| `Sector Mapping ID` | String | Sector mapping identifier | `"SM-000524"` |

### Item Information Fields

| Field Name | Data Type | Description | Example |
|---------|---------|------|-----|
| `Item Name` | String | Item short name | `"instrumentation"` |
| `Detailed Item Name` | String | Detailed item name | `"Process control & instrumentation (PLC/SCADA)"` |
| `Sector Name` | String | Sector name | `"Critical Minerals"` |
| `Subtotal` | Number | Number of related organizations | `7` |

### Organization Information Fields

| Field Name | Data Type | Description | Example |
|---------|---------|------|-----|
| `Organisation Capability` | String | Organization capability identifier | `"OC-018235"` |
| `Organisation: Organisation Name` | String | Organization name | `"Organisation Name"` |
| `Organisation: Organisation ID` | String | Organization unique identifier | `"0017F00001ueJZy"` |
| `Capability Type` | String | Capability type | `"Supplier"` or `"Manufacturer"` |
| `Validation Date` | String | Validation date | `"1/07/2025"` |

### Address Information Fields

| Field Name | Data Type | Description | Example |
|---------|---------|------|-----|
| `Organisation: Billing Street` | String | Billing street address | `"5 Caribbean Drive"` |
| `Organisation: Billing City` | String | Billing city | `"Scoresby"` |
| `Organisation: Billing State/Province` | String | Billing state/province | `"VIC"` |
| `Organisation: Billing Zip/Postal Code` | String | Billing postal code | `"3179"` |

## Data Characteristics

### Sector Categories

- **Main Sector**: Critical Minerals
- **Other Sectors**: May contain additional industrial sectors based on data content

### Capability Types

- **Supplier**: Suppliers
- **Manufacturer**: Manufacturers

### Geographic Distribution

Data contains organization information from Australian states:

- **VIC**: Victoria
- **NSW**: New South Wales
- **QLD**: Queensland
- **SA**: South Australia
- **WA**: Western Australia

### Item Category Examples

- Process control & instrumentation systems
- Dust collectors, scrubbers, and gas handling systems
- Various industrial tanks and reactors

## Data Quality Considerations

### Null Value Handling

- Some records may contain empty organization arrays `"Organizations": []`
- Some fields may contain placeholder values like `"#N/A"`
- Some date fields may be empty strings

### Data Consistency

- Organization names in examples show generic "Organisation Name", actual usage should contain real organization names
- All ID fields follow specific naming conventions (e.g., DITM-, ITM-, SM-, OC- prefixes)

## Usage Recommendations

1. **Data Indexing**: Recommend indexing based on `Item ID`, `Organisation ID`, and `Sector Name`
2. **Data Validation**: Verify completeness of essential fields before processing data
3. **Geographic Queries**: Filter by state/province fields for location-based searches
4. **Capability Matching**: Use `Capability Type` to distinguish between suppliers and manufacturers

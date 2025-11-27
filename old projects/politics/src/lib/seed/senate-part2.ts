/**
 * Federal Government Seed Data - US Senate Part 2
 * 
 * 119th United States Congress (2025-2027)
 * Continuation from Massachusetts through Wyoming
 * 
 * Created: 2025-11-13
 */

/**
 * Senator data structure for reference
 * (These positions will be filled by players in the game)
 */
export interface SenatorData {
  name: string;
  state: string;
  party: 'D' | 'R' | 'I';
  class: 1 | 2 | 3;
  assumedOffice: string;
  termEnds: number;
}

export const senatePart2: SenatorData[] = [
  // Michigan
  { name: 'Gary Peters', state: 'MI', party: 'D', class: 2, assumedOffice: '2015', termEnds: 2027 },
  { name: 'Elissa Slotkin', state: 'MI', party: 'D', class: 1, assumedOffice: '2025', termEnds: 2031 },
  
  // Minnesota
  { name: 'Amy Klobuchar', state: 'MN', party: 'D', class: 1, assumedOffice: '2007', termEnds: 2031 },
  { name: 'Tina Smith', state: 'MN', party: 'D', class: 2, assumedOffice: '2018', termEnds: 2027 },
  
  // Mississippi
  { name: 'Roger Wicker', state: 'MS', party: 'R', class: 1, assumedOffice: '2007', termEnds: 2031 },
  { name: 'Cindy Hyde-Smith', state: 'MS', party: 'R', class: 2, assumedOffice: '2018', termEnds: 2027 },
  
  // Missouri
  { name: 'Josh Hawley', state: 'MO', party: 'R', class: 1, assumedOffice: '2019', termEnds: 2025 },
  { name: 'Eric Schmitt', state: 'MO', party: 'R', class: 3, assumedOffice: '2023', termEnds: 2029 },
  
  // Montana
  { name: 'Jon Tester', state: 'MT', party: 'D', class: 1, assumedOffice: '2007', termEnds: 2025 },
  { name: 'Steve Daines', state: 'MT', party: 'R', class: 2, assumedOffice: '2015', termEnds: 2027 },
  
  // Nebraska
  { name: 'Deb Fischer', state: 'NE', party: 'R', class: 1, assumedOffice: '2013', termEnds: 2031 },
  { name: 'Pete Ricketts', state: 'NE', party: 'R', class: 2, assumedOffice: '2023', termEnds: 2027 },
  
  // Nevada
  { name: 'Catherine Cortez Masto', state: 'NV', party: 'D', class: 3, assumedOffice: '2017', termEnds: 2029 },
  { name: 'Jacky Rosen', state: 'NV', party: 'D', class: 1, assumedOffice: '2019', termEnds: 2025 },
  
  // New Hampshire
  { name: 'Jeanne Shaheen', state: 'NH', party: 'D', class: 2, assumedOffice: '2009', termEnds: 2027 },
  { name: 'Maggie Hassan', state: 'NH', party: 'D', class: 3, assumedOffice: '2017', termEnds: 2029 },
  
  // New Jersey
  { name: 'Cory Booker', state: 'NJ', party: 'D', class: 2, assumedOffice: '2013', termEnds: 2027 },
  { name: 'George Helmy', state: 'NJ', party: 'D', class: 1, assumedOffice: '2024', termEnds: 2025 },
  
  // New Mexico
  { name: 'Martin Heinrich', state: 'NM', party: 'D', class: 1, assumedOffice: '2013', termEnds: 2031 },
  { name: 'Ben Ray Luján', state: 'NM', party: 'D', class: 2, assumedOffice: '2021', termEnds: 2027 },
  
  // New York
  { name: 'Chuck Schumer', state: 'NY', party: 'D', class: 3, assumedOffice: '1999', termEnds: 2029 },
  { name: 'Kirsten Gillibrand', state: 'NY', party: 'D', class: 1, assumedOffice: '2009', termEnds: 2031 },
  
  // North Carolina
  { name: 'Thom Tillis', state: 'NC', party: 'R', class: 2, assumedOffice: '2015', termEnds: 2027 },
  { name: 'Ted Budd', state: 'NC', party: 'R', class: 3, assumedOffice: '2023', termEnds: 2029 },
  
  // North Dakota
  { name: 'John Hoeven', state: 'ND', party: 'R', class: 3, assumedOffice: '2011', termEnds: 2029 },
  { name: 'Kevin Cramer', state: 'ND', party: 'R', class: 1, assumedOffice: '2019', termEnds: 2025 },
  
  // Ohio
  { name: 'Sherrod Brown', state: 'OH', party: 'D', class: 1, assumedOffice: '2007', termEnds: 2025 },
  { name: 'JD Vance', state: 'OH', party: 'R', class: 3, assumedOffice: '2023', termEnds: 2029 },
  
  // Oklahoma
  { name: 'James Lankford', state: 'OK', party: 'R', class: 2, assumedOffice: '2015', termEnds: 2027 },
  { name: 'Markwayne Mullin', state: 'OK', party: 'R', class: 3, assumedOffice: '2023', termEnds: 2029 },
  
  // Oregon
  { name: 'Ron Wyden', state: 'OR', party: 'D', class: 3, assumedOffice: '1996', termEnds: 2029 },
  { name: 'Jeff Merkley', state: 'OR', party: 'D', class: 2, assumedOffice: '2009', termEnds: 2027 },
  
  // Pennsylvania
  { name: 'Bob Casey Jr.', state: 'PA', party: 'D', class: 1, assumedOffice: '2007', termEnds: 2025 },
  { name: 'John Fetterman', state: 'PA', party: 'D', class: 3, assumedOffice: '2023', termEnds: 2029 },
  
  // Rhode Island
  { name: 'Jack Reed', state: 'RI', party: 'D', class: 2, assumedOffice: '1997', termEnds: 2027 },
  { name: 'Sheldon Whitehouse', state: 'RI', party: 'D', class: 1, assumedOffice: '2007', termEnds: 2031 },
  
  // South Carolina
  { name: 'Lindsey Graham', state: 'SC', party: 'R', class: 2, assumedOffice: '2003', termEnds: 2027 },
  { name: 'Tim Scott', state: 'SC', party: 'R', class: 3, assumedOffice: '2013', termEnds: 2029 },
  
  // South Dakota
  { name: 'John Thune', state: 'SD', party: 'R', class: 3, assumedOffice: '2005', termEnds: 2029 },
  { name: 'Mike Rounds', state: 'SD', party: 'R', class: 2, assumedOffice: '2015', termEnds: 2027 },
  
  // Tennessee
  { name: 'Marsha Blackburn', state: 'TN', party: 'R', class: 1, assumedOffice: '2019', termEnds: 2025 },
  { name: 'Bill Hagerty', state: 'TN', party: 'R', class: 2, assumedOffice: '2021', termEnds: 2027 },
  
  // Texas
  { name: 'John Cornyn', state: 'TX', party: 'R', class: 2, assumedOffice: '2002', termEnds: 2027 },
  { name: 'Ted Cruz', state: 'TX', party: 'R', class: 1, assumedOffice: '2013', termEnds: 2031 },
  
  // Utah
  { name: 'Mike Lee', state: 'UT', party: 'R', class: 3, assumedOffice: '2011', termEnds: 2029 },
  { name: 'Mitt Romney', state: 'UT', party: 'R', class: 1, assumedOffice: '2019', termEnds: 2025 },
  
  // Vermont
  { name: 'Bernie Sanders', state: 'VT', party: 'I', class: 1, assumedOffice: '2007', termEnds: 2031 },
  { name: 'Peter Welch', state: 'VT', party: 'D', class: 3, assumedOffice: '2023', termEnds: 2029 },
  
  // Virginia
  { name: 'Mark Warner', state: 'VA', party: 'D', class: 2, assumedOffice: '2009', termEnds: 2027 },
  { name: 'Tim Kaine', state: 'VA', party: 'D', class: 1, assumedOffice: '2013', termEnds: 2031 },
  
  // Washington
  { name: 'Patty Murray', state: 'WA', party: 'D', class: 3, assumedOffice: '1993', termEnds: 2029 },
  { name: 'Maria Cantwell', state: 'WA', party: 'D', class: 1, assumedOffice: '2001', termEnds: 2031 },
  
  // West Virginia
  { name: 'Shelley Moore Capito', state: 'WV', party: 'R', class: 2, assumedOffice: '2015', termEnds: 2027 },
  { name: 'Jim Justice', state: 'WV', party: 'R', class: 1, assumedOffice: '2025', termEnds: 2031 },
  
  // Wisconsin
  { name: 'Ron Johnson', state: 'WI', party: 'R', class: 3, assumedOffice: '2011', termEnds: 2029 },
  { name: 'Tammy Baldwin', state: 'WI', party: 'D', class: 1, assumedOffice: '2013', termEnds: 2031 },
  
  // Wyoming
  { name: 'John Barrasso', state: 'WY', party: 'R', class: 1, assumedOffice: '2007', termEnds: 2031 },
  { name: 'Cynthia Lummis', state: 'WY', party: 'R', class: 2, assumedOffice: '2021', termEnds: 2027 },
];


const fs = require('fs');

// Check if the command-line arguments are provided correctly
if (process.argv.length !== 4) {
    console.log('Usage: node challenge.js users.json companies.json');
    process.exit(1);
  }
  
  const usersFilePath = process.argv[2];
  const companiesFilePath = process.argv[3];
try {
  // Read the JSON data from users and companies files
  const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
  const companiesData = JSON.parse(fs.readFileSync(companiesFilePath, 'utf-8'));

  // Handle the case where input JSON files are empty
  if (!usersData.length || !companiesData.length) {
    console.log('No users or companies data found. Exiting.');
    process.exit(0); // Exit gracefully
  }

  // Validate the JSON data for users
  const validUsersData = usersData.filter(user => {
    const requiredFields = ['id', 'first_name', 'last_name', 'company_id', 'email_status', 'active_status', 'tokens'];
    for (const field of requiredFields) {
      if (!(field in user)) {
        console.error(`Invalid user data: Missing required field '${field}' for user ID ${user.id}`);
        return false;
      }
    }

    // Validate the data types of fields (e.g., numeric fields should be numbers)
    if (typeof user.id !== 'number' || typeof user.company_id !== 'number' || typeof user.email_status !== 'boolean' || typeof user.active_status !== 'boolean' || typeof user.tokens !== 'number') {
      console.error(`Invalid user data: Incorrect data types for user ID ${user.id}`);
      return false;
    }

    // Handle negative token balances
    if (user.tokens < 0) {
      console.warn(`Warning: User ${user.id} has a negative token balance. Adjusting to 0.`);
      user.tokens = 0;
    }

    // Check for missing email field
    if (!user.email || user.email.trim() === '') {
      console.error(`Invalid user data: Missing or empty email field for user ID ${user.id}`);
      return false;
    }

    // Validate company_id
    if (!companiesData.some(company => company.id === user.company_id)) {
      console.error(`Invalid user data: User ${user.id} references a non-existent company (company_id: ${user.company_id})`);
      return false;
    }

    return true; // Data is valid for this user
  });

  // Handle the case where all user data is invalid
  if (!validUsersData.length) {
    console.log('No valid user data found. Exiting.');
    process.exit(0); // Exit gracefully
  }

  // Group users by company
  const usersByCompany = {};
  usersData.forEach(user => {
    if (user.company_id in usersByCompany) {
      usersByCompany[user.company_id].push(user);
    } else {
      usersByCompany[user.company_id] = [user];
    }
  });

  // Sort companies by company id
  companiesData.sort((a, b) => a.id - b.id);

  // Function to generate output for a single company
  function generateCompanyOutput(company) {
    const companyUsers = usersByCompany[company.id] || [];
    const emailedUsers = companyUsers.filter(user => (user.email_status && user.active_status) || (user.email_status && !user.active_status) ); // Filter emailed and active users
    const notEmailedUsers = companyUsers.filter(user => !user.email_status && user.active_status || (!user.email_status && user.active_status)); // Filter not emailed but active users

    let output = `Company Id: ${company.id}\nCompany Name: ${company.name}\n`;

    if (emailedUsers.length > 0) {
      output += '-----Users Emailed------:\n';
      emailedUsers.forEach(user => {
        const previousBalance = user.tokens; // Previous balance is the current balance
        if(user.active_status){
            user.tokens += Math.max(company.top_up, 0);  
        } 
        
        output += `${user.last_name}, ${user.first_name}, ${user.email}\n`;
        output += `  Previous Token Balance: ${previousBalance}\n`;
        output += `  New Token Balance: ${user.tokens}\n`;
      });
    }

    if (notEmailedUsers.length > 0) {
      output += '---------Users Not Emailed-------:\n';
      notEmailedUsers.forEach(user => {
        const previousBalance = user.tokens; // Previous balance is the current balance
        user.tokens += Math.max(company.top_up, 0); // Ensure top-up is not negative
        output += `${user.last_name}, ${user.first_name}, ${user.email}\n`;
        output += `  Previous Token Balance: ${previousBalance}\n`;
        output += `  New Token Balance: ${user.tokens}\n`;
      });
    }
    totaltopup = emailedUsers.filter(user => user.active_status)

    output += `Total amount of top-ups for ${company.name}: ${
      
      company.top_up * (totaltopup.length) 
    }\n`;

    return output;
  }

  // Generate output for all companies
  const outputText = companiesData.map(company => generateCompanyOutput(company)).join('\n');

  // Write output text to output.txt file
  fs.writeFileSync('output.txt', outputText);

  console.log('Output file (output.txt) has been generated successfully.');
} catch (error) {
  console.error('An error occurred:', error.message);
}

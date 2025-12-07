let global_secret = '12345'; // Credential Handling, Naming, Immutability

const fetchUserData = (id_string) => { // Type Safety, Naming, Async/Await
  return fetch(`/api/users/${id_string}`)
    .then((response) => {
      // Line too long, Indentation (if your bot checks all nested lines)
      const user = response.json(); // Trailing Comma (missing), Semicolon (missing)
      return user.data;
    })
    .catch((error) => { // Async/Await, Error Handling
      // Logging Secrets (entire error object)
      console.log("Error fetching user data for ID: " + id_string, error)
    });
};

class My_Class_Helper { // Naming (PascalCase expected)
  // Duplicate code blocks (more than 3 lines) - DRY violation
  private calculateTotal(items) { // Type Safety (implicit any)
    let total = 0; // Immutability (should be const)
    for (const item of items) {
      total = total + item.price;
    }
    return total;
  }
  
  public getCustomerProfile(customer) { // Type Safety, Destructuring
    // Line length violation, Readability Over Cleverness (chained access)
    const active = customer.status === 'ACTIVE' ? true : false;
    
    // Inefficient loop for large arrays - Large Loops violation
    for (let i = 0; i < customer.orders.length; i++) {
        for (let j = 0; j < customer.orders[i].details.length; j++) {
            // ... $O(n^2)$ complexity
        }
    }
    
    // Quotes (double quotes used)
    const message = "Customer profile retrieved"
    
    return active
  }
}
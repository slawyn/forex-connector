export function mergeArray(array) {
    return array.reduce((merged, dictionary) => mergeDict(merged, dictionary), {});
  }
  
export function mergeDict(previous, next) {
    for (const [key, value] of Object.entries(next)) {
      if (key in previous && typeof value === 'object' && value !== null) {
        previous[key] = mergeDict(previous[key], value);
      } else {
        previous[key] = value;
      }
    }
    return previous;
  }
  
export function createPostRequest(body) {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer my-token',
      },
      body: JSON.stringify(body), // Ensure body is a string
    };
  }


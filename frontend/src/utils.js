export function mergeArray(array) {
    let merged = {}
    array.forEach((dictionary, index) => {
        merged = mergeDict(merged, dictionary)
    })
    return merged
}

export function mergeDict(previous, next) {
    for (let [key, value] of Object.entries(next)) {
        if (key in previous && value instanceof Object) {
            previous[key] = mergeDict(previous[key], value)
        }
        else {
            previous[key] = value
        }
    }
    return previous
}

export function createPostRequest(body) {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my-token',
      },
      body: body
    };
  }
  

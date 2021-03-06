window.RailsAPI = ->
  this.updateStickies = (data) ->
    new Promise (resolve, reject) ->
      $.ajax({
        type: 'POST',
        url: 'stickies',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({ stickies: data }),
        success: (data, status) ->
          console.log(data)
          console.log(status)
          resolve(data)
        ,
        error: (xhr, status) ->
          reject(new Error(xhr + " responded with " + status))
      })

  this.loadStickies = () ->
    new Promise (resolve, reject) ->
      $.ajax({
        url: 'stickies.json',
        dataType: 'json'
      }).done (re) ->
        resolve(re)

  this.deleteSticky = (sticky_id) ->
    new Promise (resolve, reject) ->
      $.ajax({
        type: 'DELETE',
        url: 'stickies',
        data: { id: sticky_id },
        dataType: 'json',
        success: (data, status) ->
          if data['success'] == 'true'
            resolve(data)
          else
            reject(new Error("Can't delete: " + data))
      })

  undefined

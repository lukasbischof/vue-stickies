(function() {
  "use strict";

  var api = new RailsAPI();

  var changedStickies = {}
  function stickyChanged(sticky) {
    // Track changes to inform the API about them later
    // This has to be done manually because Vue doesn't do "dirty checking"
    // for performance reasons (https://github.com/vuejs/vue/issues/96#issuecomment-35052704)
    changedStickies[sticky.id.toString()] = { title: sticky.title, content: sticky.content };
  }

  function persistStickies() {
    var data = []
    for (var key in changedStickies) {
      // transform the data in a rails friendly structure
      data.push({ id: key, title: changedStickies[key].title, content: changedStickies[key].content })
    }

    api.updateStickies(data).then(function(data) {
      UIkit.notification({
        message: 'Stickies saved',
        status: 'success'
      });
    }, function(error) {
      UIkit.notification({
        message: "Can't update stickies",
        status: 'danger'
      });

      throw error;
    });
  }

  window.addEventListener("load", function() {
    // Register the component
    Vue.component('sticky', {
      props: ['sticky'], // Properties which can be set from the outside
      template: '#sticky-template', // x-template script element from index.html.erb

      data: function() {
        // In a component, you have to use a function returning the data
        // to prevent that multiple components edit the same data
        // https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function

        return {
          editing: false,
          editButtonTitle: 'Edit',
        };
      },

      watch: {
        sticky: {
          handler: function(newVal) {
            // Declare a watcher to get notified when the underlying data changes
            stickyChanged(newVal)
          },

          deep: true
        }
      },

      methods: {
        deleteButtonPressed: function(e) {
          // Emit the event so that the parent can listen for the delete event
          this.$emit('delete', this, e);
        },
        toggleEditingMode: function() {
          this.editing = !this.editing;
          this.editButtonTitle = this.editing ? 'Done' : 'Edit';
          if (this.editing) {
            // Execute code in the next update cycle:
            // If we set the flag right here, the virtual DOM wouldn't be rendered yet
            // and the changes to the refs would have no effect to the real DOM
            this.$nextTick(function() {
              // $refs is an array with all references in the template code
              this.$refs['title-input-' + this.sticky.id].focus();
            });
          }
        }
      }
    })

    // Initialize main Vm
    window.app = new Vue({
      el: '#app', // Reference the "main" element where the application lives in
      data: {
        stickies: [],
        changed: false,
        status: "There are no stickies yet",
        error_occurred: false
      },
      methods: {
        addSticky: function() {
          window.__id = window.__id || -1 // Negative id = created new sticky.
          this.stickies.push({ id: window.__id--, title: "", content: "" })
          // Use push to tell Vue that an element has been added to the list
          //
          // this.stickies[this.stickies.length] = { id: window.__id--, title: "", content: "" };
          // would have no effect to the view update, because Vue is unable to track changes made
          // this way due to limitations in JavaScript
          // https://vuejs.org/v2/guide/list.html#Caveats
        },

        save: function() {
          persistStickies();
        },

        deleteButtonPressed: function(child, e) {
          UIkit.modal.confirm('Do you really want to delete this sticky note?').then(function() {
            // Confirmed => delete sticky

            var delSticky = function(stickyToDelete) {
              for (var i = 0; i < app.stickies.length; ++i) {
                var sticky = app.stickies[i];
                if (sticky.id === stickyToDelete.id) {
                  // Delete sticky from the vue app data array
                  app.stickies.splice(i, 1);
                  UIkit.notification("Successfully deleted sticky", { status: 'success' });
                  return;
                }
              }
            };

            // Sticky isn't in the DB yet => no API call needed
            if (child.sticky.id < 0) {
              delSticky(child.sticky);
              return;
            }

            api.deleteSticky(child.sticky.id).then(function(data) {
              // Successfully deleted sticky from DB => update UI
              delSticky(child.sticky);
            }, function(err) {
              UIkit.notification("Couldn't delete sticky", { status: 'warning' })
              throw err;
            });
          }, function () {
            // (Modal): Rejected. Do work or just let the modal dismiss itself
          });
        }
      }
    })

    api.loadStickies().then(function(re) {
      Vue.set(app, 'stickies', re);
    }, function(err) {
      UIkit.notification({
        message: "Can't load data",
        status: 'danger'
      });
      app.status = "There occurred an error while loading the data";
      app.error_occurred = true;
    });
  });
})();

(function() {
  "use strict";

  var api = new RailsAPI();

  var changedStickies = {}
  function stickyChanged(sticky) {
    changedStickies[sticky.id.toString()] = { title: sticky.title, content: sticky.content };
  }

  function persistStickies() {
    var data = []
    for (var key in changedStickies) {
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
    Vue.component('sticky', {
      props: ['sticky'],
      template: '#sticky-template',

      data: function() {
        return {
          editing: false,
          editButtonTitle: 'Edit',
        };
      },

      watch: {
        sticky: {
          handler: function(newVal) {
            stickyChanged(newVal)
          },

          deep: true
        }
      },

      methods: {
        deleteButtonPressed: function(e) {
          this.$emit('delete', this, e);
        },
        toggleEditingMode: function() {
          this.editing = !this.editing;
          this.editButtonTitle = this.editing ? 'Done' : 'Edit';
          if (this.editing) {
            this.$nextTick(function() {
              // $refs is an array with all references in the template code
              this.$refs['title-input-' + this.sticky.id].focus();
            });
          }
        }
      }
    })

    window.app = new Vue({
      el: '#app',
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
                  app.stickies.splice(i, 1);
                  UIkit.notification("Successfully deleted sticky", { status: 'success' });
                  return;
                }
              }
            };

            // Sticky isn't in the DB yet
            if (child.sticky.id < 0) {
              delSticky(child.sticky);
              return;
            }

            api.deleteSticky(child.sticky.id).then(function(data) {
              delSticky(child.sticky);
            }, function(err) {
              UIkit.notification("Couldn't delete sticky", { status: 'warning' })
              throw err;
            });
          }, function () {
            // Rejected. Do work or just let the modal dismiss itself
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

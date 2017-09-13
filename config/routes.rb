Rails.application.routes.draw do
  root 'stickies#index'
  get 'stickies', to: 'stickies#index', as: 'stickies'
  post 'stickies', to: 'stickies#update'
  delete 'stickies', to: 'stickies#destroy'
end

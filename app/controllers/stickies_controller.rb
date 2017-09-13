class StickiesController < ApplicationController # :nodoc:
  def index
    stickies = Sticky.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: stickies }
    end
  end

  def update
    stickies_params[:stickies].each do |sticky|
      if sticky[:id].to_i.negative?
        Sticky.create(title: sticky[:title], content: sticky[:content])
      else
        Sticky.find(sticky[:id].to_i).update(sticky)
      end
    end

    respond_empty_json
  end

  def destroy
    success = Sticky.find(params.require(:id)).destroy
    respond_to do |format|
      format.json { render json: { success: (!success.nil?).to_s } }
    end
  end

  def respond_empty_json
    respond_to do |format|
      format.json { render json: {} }
    end
  end

  def stickies_params
    params.permit(stickies: %i[id title content])
  end
end

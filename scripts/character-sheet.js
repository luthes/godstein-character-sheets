class GodsteinCharacterSheet extends ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['godstein', 'sheet', 'actor'],
            template: "modules/godstein-character-sheet/templates/custom-sheet.html",
            width: 600,
            height: 800,
            tabs: [{ 
                navSelector: ".sheet-tabs", 
                contentSelector: ".sheet-body", 
                initial: "attributes" 
            }]
        });
    }

    getData() {
        const context = super.getData();
        const actorData = this.actor.toObject(false);

        // Add the actor's data to context.system for easier access
        context.system = actorData.system;
        
        // Add actor's miracles as items of type 'miracle'
        context.miracles = actorData.items.filter(item => item.type === "miracle");

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("item-id"));
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("item-id"));
            item.delete();
            li.slideUp(200, () => this.render(false));
        });
    }

    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const data = duplicate(header.dataset);
        const name = `New ${type.capitalize()}`;
        const itemData = {
            name: name,
            type: type,
            data: data
        };
        // Create the item and render its sheet
        return await Item.create(itemData, {parent: this.actor});
    }
}

// Register the custom character sheet
Actors.registerSheet("godstein", GodsteinCharacterSheet, { 
    types: ["character"],
    makeDefault: true,
    label: "Godstein Character Sheet"
});

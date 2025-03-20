// Add Handlebars helpers
Handlebars.registerHelper('localizeTime', function(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
});

Handlebars.registerHelper('selected', function(value, target) {
    return value === target ? 'selected' : '';
});

Handlebars.registerHelper('checked', function(value) {
    return value ? 'checked' : '';
});

// Register module settings
function registerSettings() {
    game.settings.register("godstein-character-sheet", "maxDivinePower", {
        name: "Maximum Divine Power",
        hint: "The maximum value allowed for Divine Power",
        scope: "world",
        config: true,
        type: Number,
        default: 10,
        range: {
            min: 0,
            max: 50,
            step: 5
        }
    });

    game.settings.register("godstein-character-sheet", "defaultDivinePower", {
        name: "Default Divine Power",
        hint: "The starting value for Divine Power for new characters",
        scope: "world",
        config: true,
        type: Number,
        default: 0,
        range: {
            min: 0,
            max: 50,
            step: 5
        }
    });

}

class GodsteinCharacterSheet extends ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['godstein', 'sheet', 'actor'],
            template: "modules/godstein-character-sheet/templates/custom-sheet.html",
            width: 400,
            height: 800,
            tabs: [{ 
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "description"
            }]
        });
    }

    getData() {
        const context = super.getData();
        const actorData = this.actor.toObject(false);

        console.log("Actor Data:", actorData);
        
        // Add the actor's data to context.system for easier access
        context.system = actorData.system;
        context.flags = actorData.flags;
        
        // Ensure godstein flags exist
        if (!context.flags?.godstein) {
            context.flags = context.flags || {};
            context.flags.godstein = {
                name: "",
                domains: {
                    primary: "",
                    secondary: "",
                    discarded: ""
                },
                divinePower: {
                    value: game.settings.get("godstein-character-sheet", "defaultDivinePower"),
                    max: game.settings.get("godstein-character-sheet", "maxDivinePower")
                },
                alignment: "",
                chosen_people: "",
                follower_types: "",
                goal: "",
                relationships: "",
                notes: "",
                divine_artifact: "",
                preferred_biomes: {
                    plains: false,
                    mountains: false,
                    swamp: false,
                    forest: false,
                    island: false,
                    // Initialize crossed-out states
                    plains_crossed: false,
                    mountains_crossed: false,
                    swamp_crossed: false,
                    forest_crossed: false,
                    island_crossed: false
                }
            };
        }

        // Ensure alignment is a string
        if (typeof context.flags.godstein.alignment !== 'string') {
            context.flags.godstein.alignment = "";
        }

        // Ensure notes and divine_artifact are strings
        if (typeof context.flags.godstein.notes !== 'string') {
            context.flags.godstein.notes = "";
        }
        
        if (typeof context.flags.godstein.divine_artifact !== 'string') {
            context.flags.godstein.divine_artifact = "";
        }

        // Ensure preferred_biomes structure exists
        if (!context.flags.godstein.preferred_biomes) {
            context.flags.godstein.preferred_biomes = {
                plains: false,
                mountains: false,
                swamp: false,
                forest: false,
                island: false,
                // Initialize crossed-out states
                plains_crossed: false,
                mountains_crossed: false,
                swamp_crossed: false,
                forest_crossed: false,
                island_crossed: false
            };
        }

        // Ensure crossed-out states exist
        if (context.flags.godstein.preferred_biomes.plains_crossed === undefined) {
            context.flags.godstein.preferred_biomes.plains_crossed = false;
        }
        if (context.flags.godstein.preferred_biomes.mountains_crossed === undefined) {
            context.flags.godstein.preferred_biomes.mountains_crossed = false;
        }
        if (context.flags.godstein.preferred_biomes.swamp_crossed === undefined) {
            context.flags.godstein.preferred_biomes.swamp_crossed = false;
        }
        if (context.flags.godstein.preferred_biomes.forest_crossed === undefined) {
            context.flags.godstein.preferred_biomes.forest_crossed = false;
        }
        if (context.flags.godstein.preferred_biomes.island_crossed === undefined) {
            context.flags.godstein.preferred_biomes.island_crossed = false;
        }

        console.log("Context:", context);
        
        // Add settings to context
        context.settings = {
            maxDivinePower: game.settings.get("godstein-character-sheet", "maxDivinePower")
        };

        // Add isGM flag
        context.isGM = game.user.isGM;
        
        // Add actor's items, filtering for our orders and sorting by time
        context.orders = actorData.items
            .filter(item => item.type === "feat" && foundry.utils.getProperty(item, "flags.godstein.isOrder"))
            .sort((a, b) => {
                const timeA = foundry.utils.getProperty(a, "flags.godstein.time") || 0;
                const timeB = foundry.utils.getProperty(b, "flags.godstein.time") || 0;
                return timeB - timeA; // Sort newest to oldest
            });

        return context;
    }

    async _updateObject(event, formData) {
        // Handle the form data submission
        const updateData = foundry.utils.expandObject(formData);
        
        console.log("Form Data:", formData);
        console.log("Update Data:", updateData);
        
        // Create the proper update structure for flags
        const finalUpdate = {
            // Update the actor's name at the top level
            name: formData["name"] || this.actor.name,
            flags: {
                godstein: {
                    domains: {
                        primary: formData["flags.godstein.domains.primary"] || "",
                        secondary: formData["flags.godstein.domains.secondary"] || "",
                        discarded: formData["flags.godstein.domains.discarded"] || ""
                    },
                    divinePower: {
                        value: parseInt(formData["flags.godstein.divinePower.value"]) || 0,
                        max: parseInt(formData["flags.godstein.divinePower.max"]) || game.settings.get("godstein-character-sheet", "maxDivinePower")
                    },
                    alignment: formData["flags.godstein.alignment"] || "",
                    follower_types: formData["flags.godstein.follower_types"] || "",
                    goal: formData["flags.godstein.goal"] || "",
                    relationships: formData["flags.godstein.relationships"] || "",
                    chosen_people: formData["flags.godstein.chosen_people"] || "",
                    notes: formData["flags.godstein.notes"] || "",
                    divine_artifact: formData["flags.godstein.divine_artifact"] || "",
                    preferred_biomes: {
                        plains: formData["flags.godstein.preferred_biomes.plains"] ? true : false,
                        mountains: formData["flags.godstein.preferred_biomes.mountains"] ? true : false,
                        swamp: formData["flags.godstein.preferred_biomes.swamp"] ? true : false,
                        forest: formData["flags.godstein.preferred_biomes.forest"] ? true : false,
                        island: formData["flags.godstein.preferred_biomes.island"] ? true : false,
                        // Add crossed-out states
                        plains_crossed: formData["flags.godstein.preferred_biomes.plains_crossed"] === "true",
                        mountains_crossed: formData["flags.godstein.preferred_biomes.mountains_crossed"] === "true",
                        swamp_crossed: formData["flags.godstein.preferred_biomes.swamp_crossed"] === "true",
                        forest_crossed: formData["flags.godstein.preferred_biomes.forest_crossed"] === "true",
                        island_crossed: formData["flags.godstein.preferred_biomes.island_crossed"] === "true"
                    }
                }
            }
        };

        console.log("Final Update Structure:", finalUpdate);
        // Update the actor
        return this.actor.update(finalUpdate);
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Activate editors
        this.activateEditor(html);

        // Add input validation for Divine Power and alignment
        html.find('input[name="flags.godstein.divinePower.value"]').change(this._onDivinePowerChange.bind(this));
        html.find('input[name="flags.godstein.divinePower.max"]').change(this._onDivinePowerMaxChange.bind(this));

        // Add new order
        html.find('.add-order').click(this._onAddOrder.bind(this));

        // Accept order
        html.find('.order-accept').click(this._onAcceptOrder.bind(this));

        // Delete order
        html.find('.order-delete').click(this._onDeleteOrder.bind(this));

        // Update title when it changes
        html.find('.order-title').change(this._onUpdateTitle.bind(this));
        
        // Update summary
        html.find('.order-summary').change(this._onUpdateSummary.bind(this));

        // Add listener for executed checkbox
        html.find('.execute-order').change(this._onToggleExecuted.bind(this));

        // Handle right-click on biome checkboxes
        html.find('.biome-options .checkbox-label').on('contextmenu', this._onBiomeRightClick.bind(this));

        // Sliding tabs functionality
        const tabsNav = html.find('.sheet-tabs');
        const wrapper = html.find('.tabs-wrapper');
        const leftArrow = html.find('.nav-arrow.left');
        const rightArrow = html.find('.nav-arrow.right');
        
        let isDragging = false;
        let startX;
        let scrollLeft;
        let currentTranslate = 0;
        
        // Function to update arrow visibility
        const updateArrows = () => {
            const maxScroll = tabsNav[0].scrollWidth - wrapper[0].clientWidth;
            leftArrow.toggleClass('hidden', currentTranslate >= 0);
            rightArrow.toggleClass('hidden', currentTranslate <= -maxScroll);
        };

        // Initialize arrow visibility
        updateArrows();

        // Arrow click handlers
        leftArrow.click(ev => {
            const wrapperWidth = wrapper[0].clientWidth;
            currentTranslate = Math.min(0, currentTranslate + wrapperWidth);
            tabsNav.css('transform', `translateX(${currentTranslate}px)`);
            updateArrows();
        });

        rightArrow.click(ev => {
            const wrapperWidth = wrapper[0].clientWidth;
            const maxScroll = -(tabsNav[0].scrollWidth - wrapper[0].clientWidth);
            currentTranslate = Math.max(maxScroll, currentTranslate - wrapperWidth);
            tabsNav.css('transform', `translateX(${currentTranslate}px)`);
            updateArrows();
        });

        // Mouse drag handlers
        tabsNav.mousedown(ev => {
            isDragging = true;
            tabsNav.addClass('dragging');
            startX = ev.pageX - wrapper.offset().left - currentTranslate;
            scrollLeft = currentTranslate;
        });

        $(document).mousemove(ev => {
            if (!isDragging) return;
            ev.preventDefault();
            const x = ev.pageX - wrapper.offset().left;
            const maxScroll = -(tabsNav[0].scrollWidth - wrapper[0].clientWidth);
            currentTranslate = Math.max(Math.min(0, x - startX), maxScroll);
            tabsNav.css('transform', `translateX(${currentTranslate}px)`);
            updateArrows();
        });

        $(document).mouseup(ev => {
            isDragging = false;
            tabsNav.removeClass('dragging');
        });

        // Handle window resize
        $(window).resize(() => {
            const maxScroll = -(tabsNav[0].scrollWidth - wrapper[0].clientWidth);
            if (currentTranslate < maxScroll) {
                currentTranslate = maxScroll;
                tabsNav.css('transform', `translateX(${currentTranslate}px)`);
            }
            updateArrows();
        });
    }

    /**
     * Handle right-click on biome checkbox labels
     * @param {Event} event - The contextmenu event
     * @private
     */
    _onBiomeRightClick(event) {
        event.preventDefault();
        
        const label = event.currentTarget;
        const biomeName = label.textContent.trim().toLowerCase();
        const hiddenInput = label.querySelector(`input[name="flags.godstein.preferred_biomes.${biomeName}_crossed"]`);
        const checkbox = label.querySelector(`input[name="flags.godstein.preferred_biomes.${biomeName}"]`);
        
        // Toggle the crossed-out state
        const isCrossed = label.classList.contains('crossed-out');
        label.classList.toggle('crossed-out');
        
        // Update the hidden input value
        hiddenInput.value = isCrossed ? "" : "true";
        
        // If we're crossing out, uncheck the checkbox
        if (!isCrossed) {
            // Uncheck normal checkbox state
            checkbox.checked = false;
            
            // Force redraw to ensure the X appears properly
            checkbox.style.display = 'none';
            setTimeout(() => {
                checkbox.style.display = '';
            }, 5);
        }
        
        this._onSubmit(event);
    }

    async _onDivinePowerChange(event) {
        event.preventDefault();
        const maxAllowed = game.settings.get("godstein-character-sheet", "maxDivinePower");
        const newValue = Math.min(Math.max(0, parseInt(event.target.value) || 0), maxAllowed);
        await this.actor.update({"flags.godstein.divinePower.value": newValue});
    }

    async _onDivinePowerMaxChange(event) {
        event.preventDefault();
        const maxAllowed = game.settings.get("godstein-character-sheet", "maxDivinePower");
        const newValue = Math.min(Math.max(0, parseInt(event.target.value) || 0), maxAllowed);
        await this.actor.update({"flags.godstein.divinePower.max": newValue});
    }

    async _onAddOrder(event) {
        event.preventDefault();
        
        // Create a more descriptive default title that encourages users to change it
        const defaultTitle = "Enter Order Title";
        
        const itemData = {
            name: defaultTitle,
            type: "feat",
            flags: {
                godstein: {
                    isOrder: true,
                    accepted: false,
                    executed: false,
                    time: Date.now(),
                    summary: "",
                    // Store the original default title to detect if it was changed
                    defaultTitle: true
                }
            }
        };
        
        console.log("Creating new order with data:", itemData);
        const newItem = await Item.create(itemData, {parent: this.actor});
        
        // Force focus on the title input after a short delay to allow rendering
        setTimeout(() => {
            const sheet = this.element[0];
            if (sheet) {
                const newOrderDiv = sheet.querySelector(`.order-item[data-item-id="${newItem.id}"]`);
                if (newOrderDiv) {
                    const titleInput = newOrderDiv.querySelector('.order-title');
                    if (titleInput) {
                        titleInput.focus();
                        titleInput.select();
                    }
                }
            }
        }, 100);
    }

    async _onAcceptOrder(event) {
        event.preventDefault();
        const orderDiv = event.currentTarget.closest('.order-item');
        const itemId = orderDiv.dataset.itemId;
        const item = this.actor.items.get(itemId);
        
        if (!item) {
            console.error("Order item not found:", itemId);
            return;
        }
        
        const titleInput = orderDiv.querySelector('.order-title');
        const summaryInput = orderDiv.querySelector('.order-summary');
        
        // Debug what's happening with the title
        console.log("Original item name:", item.name);
        console.log("Title input element:", titleInput);
        console.log("Title input value:", titleInput ? titleInput.value : "null");
        
        // Get the current title and summary values
        const inputTitle = titleInput && titleInput.value ? titleInput.value.trim() : "";
        const newSummary = summaryInput && summaryInput.value ? summaryInput.value : "";
        
        // Determine if we need to update the title
        // For the title, use the input value if it's provided and different from the current name
        // Otherwise, keep the current name (it may have been updated via the change event)
        const newTitle = (inputTitle && inputTitle !== item.name && inputTitle !== "Enter Order Title") 
            ? inputTitle 
            : (item.name !== "Enter Order Title" && item.name !== "New Order" ? item.name : "Untitled Order");
        
        // Create a clone of existing godstein flags to preserve other data
        const existingFlags = foundry.utils.deepClone(item.flags.godstein || {});
        
        // Remove the defaultTitle flag once accepted
        if (existingFlags.defaultTitle) {
            delete existingFlags.defaultTitle;
        }
        
        // Update the necessary fields while preserving others
        const updateData = {
            name: newTitle,
            flags: {
                godstein: foundry.utils.mergeObject(existingFlags, {
                    accepted: true,
                    executed: false,
                    summary: newSummary,
                    isOrder: true,
                    time: existingFlags.time || Date.now()
                })
            }
        };
        
        console.log("Updating order with data:", updateData);
        
        // Update the item
        await item.update(updateData);
        
        console.log("Order saved with title:", newTitle, "and summary:", newSummary);
    }

    async _onUpdateTitle(event) {
        event.preventDefault();
        const orderDiv = event.currentTarget.closest('.order-item');
        const itemId = orderDiv.dataset.itemId;
        const item = this.actor.items.get(itemId);
        
        if (!item) {
            console.error("Order item not found for title update:", itemId);
            return;
        }
        
        const newTitle = event.currentTarget.value.trim();
        if (!newTitle) return; // Skip empty titles
        
        console.log("Updating order title to:", newTitle);
        
        // Update the title and remove the defaultTitle flag
        await item.update({
            "name": newTitle,
            "flags.godstein.defaultTitle": false
        });
    }

    async _onUpdateSummary(event) {
        event.preventDefault();
        const orderDiv = event.currentTarget.closest('.order-item');
        const itemId = orderDiv.dataset.itemId;
        const item = this.actor.items.get(itemId);
        
        if (!item) {
            console.error("Order item not found for summary update:", itemId);
            return;
        }
        
        await item.update({
            "flags.godstein.summary": event.currentTarget.value
        });
    }

    async _onDeleteOrder(event) {
        event.preventDefault();
        const orderDiv = event.currentTarget.closest('.order-item');
        const item = this.actor.items.get(orderDiv.dataset.itemId);

        // Prevent deletion if the order is executed
        if (item.flags.godstein?.executed) {
            ui.notifications.warn("Executed orders cannot be deleted.");
            return;
        }

        await item.delete();
    }

    // Add this new method for handling the executed checkbox
    async _onToggleExecuted(event) {
        event.preventDefault();
        
        // Only GMs can execute orders
        if (!game.user.isGM) {
            ui.notifications.warn("Only the Game Master can mark orders as executed.");
            event.currentTarget.checked = !event.currentTarget.checked;
            return;
        }

        const orderDiv = event.currentTarget.closest('.order-item');
        const item = this.actor.items.get(orderDiv.dataset.itemId);
        
        await item.update({
            "flags.godstein.executed": event.currentTarget.checked
        });
    }

    // Add a simplified method to handle closing without needing editor cleanup
    async close(...args) {
        return super.close(...args);
    }
}

// Initialize module
Hooks.once('init', async function() {
    console.log('Godstein Character Sheet | Initializing module');
    
    // Register custom module settings
    registerSettings();

    // Register custom fields in the DnD5e data model
    CONFIG.DND5E.characterFlags = {
        ...CONFIG.DND5E.characterFlags,
        domains: {
            name: "Divine Domains",
            hint: "Configuration for divine domains",
            section: "Godstein",
            type: Object
        },
        biomes: {
            name: "Preferred Biomes",
            hint: "Configuration for preferred biomes",
            section: "Godstein",
            type: Object
        }
    };

    // Register the custom character sheet
    Actors.registerSheet("godstein", GodsteinCharacterSheet, { 
        types: ["character"],
        makeDefault: true,
        label: "Godstein Character Sheet"
    });

    // Define template for character data
    Hooks.on("dnd5e.preCreateActor", (actor, data, options, userId) => {
        if (actor.type !== "character") return;
        foundry.utils.mergeObject(data, {
            "flags.godstein": {
                domains: {
                    primary: "",
                    secondary: "",
                    discarded: ""
                },
                preferred_biomes: {
                    plains: false,
                    mountains: false,
                    swamp: false,
                    forest: false,
                    island: false
                },
                divinePower: {
                    value: game.settings.get("godstein-character-sheet", "defaultDivinePower"),
                    max: game.settings.get("godstein-character-sheet", "maxDivinePower")
                },
                alignment: "",
                follower_types: "",
                goal: "",
                relationships: "",
                chosen_people: "",
                divine_artifact: "",
                notes: ""
            }
        });
    });
});

// Handle new actor creation
Hooks.on('createActor', async function(actor, options, userId) {
    // Only proceed if this is a character and we're the one creating it
    if (actor.type !== "character" || game.user.id !== userId) return;

    // Get default values from settings
    const defaultDivinePower = game.settings.get("godstein-character-sheet", "defaultDivinePower");

    // Update the actor with default values
    await actor.update({
        "flags.godstein": {
            divinePower: {
                value: defaultDivinePower,
                max: defaultDivinePower
            },
            alignment: "",
            follower_types: "",
            goal: "",
            relationships: "",
            chosen_people: "",
            domains: {
                primary: "",
                secondary: "",
                discarded: ""
            },
            preferred_biomes: {
                plains: false,
                mountains: false,
                swamp: false,
                forest: false,
                island: false
            }
        }
    });
});

// Migration hook for existing characters
Hooks.once('ready', async function() {
    // Get all character actors
    const characters = game.actors.filter(a => a.type === "character");
    
    for (let actor of characters) {
        const updateData = {};
        const flags = actor.flags?.godstein;

        // Check if godstein flags structure exists
        if (!flags) {
            updateData["flags.godstein"] = {
                domains: {
                    primary: "",
                    secondary: "",
                    discarded: ""
                },
                preferred_biomes: {
                    plains: false,
                    mountains: false,
                    swamp: false,
                    forest: false,
                    island: false
                },
                divinePower: {
                    value: game.settings.get("godstein-character-sheet", "defaultDivinePower"),
                    max: game.settings.get("godstein-character-sheet", "maxDivinePower")
                },
                alignment: "",
                follower_types: "",
                goal: "",
                relationships: "",
                chosen_people: "",
                notes: ""
            };
        }

        // Only update if there are changes to make
        if (Object.keys(updateData).length > 0) {
            console.log(`Migrating character ${actor.name}:`, updateData);
            await actor.update(updateData);
        }
    }
}); 

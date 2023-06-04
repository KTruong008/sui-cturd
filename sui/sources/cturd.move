module sui_cturd::cturd {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    struct Potato has key, store {
        id: UID,
        grams: u64,
    }

    entry fun create_potato(grams: u64, ctx: &mut TxContext) {
        transfer::public_transfer(
            Potato { id: object::new(ctx), grams },
            tx_context::sender(ctx),
        )
    }

    entry fun transfer_potato(potato: Potato, recipient: address) {
        transfer::public_transfer(potato, recipient)
    }

    entry fun update_potato(potato: &mut Potato, grams: u64) {
        potato.grams = grams;
    }

    entry fun weigh_potato(potato: &Potato): u64 {
        potato.grams
    }

    entry fun delete_potato(potato: Potato) {
        let Potato { id, grams: _ } = potato;
        object::delete(id);
    }


   // Tests ===============================================================
    #[test]
    fun test_create_potato() {
        use sui::test_scenario;

        let admin = @0x123;
        let user = @0x456;

        let scenario_val = test_scenario::begin(admin);
        let scenario = &mut scenario_val;
        let potato_weight = 100;

        // Create potato
        test_scenario::next_tx(scenario, user);
        create_potato(potato_weight, test_scenario::ctx(scenario));
        
        // Assert potato was created
        test_scenario::next_tx(scenario, user);
        let potato = test_scenario::take_from_sender<Potato>(scenario);
        assert!(potato.grams == potato_weight, 0);
        test_scenario::return_to_sender<Potato>(scenario, potato);

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_update_potato() {
        use sui::test_scenario;

        let admin = @0x123;
        let user = @0x456;

        let scenario_val = test_scenario::begin(admin);
        let scenario = &mut scenario_val;
        let potato_weight = 100;
        let new_potato_weight = 200;

        // Create potato
        test_scenario::next_tx(scenario, user);
        create_potato(potato_weight, test_scenario::ctx(scenario));
        
        // Update potato
        test_scenario::next_tx(scenario, user);
        let potato = test_scenario::take_from_sender<Potato>(scenario);
        assert!(potato.grams == potato_weight, 0);
        update_potato(&mut potato, new_potato_weight);
        test_scenario::return_to_sender<Potato>(scenario, potato);

        // Assert potato was updated
        test_scenario::next_tx(scenario, user);
        let potato = test_scenario::take_from_sender<Potato>(scenario);
        assert!(potato.grams == new_potato_weight, 0);
        test_scenario::return_to_sender<Potato>(scenario, potato);

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_weigh_potato() {
        use sui::test_scenario;

        let admin = @0x123;
        let user = @0x456;

        let scenario_val = test_scenario::begin(admin);
        let scenario = &mut scenario_val;
        let potato_weight = 100;

        // Create potato
        test_scenario::next_tx(scenario, user);
        create_potato(potato_weight, test_scenario::ctx(scenario));
        
        // Weigh potato
        test_scenario::next_tx(scenario, user);
        let potato = test_scenario::take_from_sender<Potato>(scenario);
        let weight = weigh_potato(&potato);
        assert!(weight == potato.grams, 0);
        test_scenario::return_to_sender<Potato>(scenario, potato);

        test_scenario::end(scenario_val);
    }
}

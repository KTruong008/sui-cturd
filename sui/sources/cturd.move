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
}

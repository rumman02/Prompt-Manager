pub mod part1;
pub mod part2;
pub mod part3;
pub mod part4;

/// One demo prompt plus the related rows (variable sets, versions) that make it
/// exercise every prompt feature in the app.
pub struct DemoPrompt {
    pub title: &'static str,
    pub content: &'static str,
    pub category: &'static str,
    pub tags: &'static str,
    pub description: &'static str,
    pub is_favorite: bool,
    /// Age of the prompt, used to backdate created_at/updated_at so the
    /// "new this week" stat and date sorting have realistic spread.
    pub days_ago: i64,
    /// Seeded straight into the trash so the Trash page is not empty.
    pub trashed: bool,
    pub var_sets: &'static [DemoVarSet],
    pub versions: &'static [DemoVersion],
}

pub struct DemoVarSet {
    pub name: &'static str,
    pub values: &'static [(&'static str, &'static str)],
}

pub struct DemoVersion {
    pub message: &'static str,
    pub content: &'static str,
}

/// Every demo prompt, in insertion order.
pub fn all() -> Vec<&'static DemoPrompt> {
    part1::PART1
        .iter()
        .chain(part2::PART2.iter())
        .chain(part3::PART3.iter())
        .chain(part4::PART4.iter())
        .collect()
}

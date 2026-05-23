namespace Entities;

public enum NoteStatus
{
    Draft = 0,
    Published = 1
}

public enum NoteBlockType
{
    Paragraph = 0,
    Heading = 1,
    ImportantNote = 2,
    Video = 3,
    Image = 4,
    DoubleImage = 5,
    Code = 6,
    Quote = 7,
    List = 8
}

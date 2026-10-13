Insider-list / need-to-know scoping

project-kingfisher_board-update.docx  the restricted document
insider-list_project-kingfisher.csv   4 people who MAY move it
has-file-access_not-on-insider-list.csv  6 people who have legitimate file
                                      access but are NOT on the insider list

Grant two users file access - one from each list - and have both attempt egress.
Pass = only the insider-list member is permitted, and the policy scope is
independent of the file permissions. If the tool can only express this as an NTFS
or Drive permission, it has failed the row: the whole point is that file access
and dealing permission are different questions.
